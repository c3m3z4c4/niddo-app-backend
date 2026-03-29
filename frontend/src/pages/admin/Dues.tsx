import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import {
  useDuesConfigQuery, useDuesSummaryQuery, useDuesPaymentsQuery,
  useDebtorsQuery, useSetDuesConfig, useGenerateDues, useUpdateDuesPayment,
} from '@/hooks/useApi';
import { DuesPayment, PaymentStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign, TrendingUp, Clock, CheckCircle2, AlertTriangle,
  Search, RefreshCw, Settings, ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { TablePagination, paginate } from '@/components/admin/TablePagination';
import { cn } from '@/lib/utils';

const MONTH_NAMES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const statusColors: Record<PaymentStatus, string> = {
  paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  exempt: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const statusLabels: Record<PaymentStatus, string> = {
  paid: 'Pagado', pending: 'Pendiente', exempt: 'Exento', overdue: 'Vencido',
};

export default function AdminDues() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Config dialog
  const [configOpen, setConfigOpen] = useState(false);
  const [newAmount, setNewAmount] = useState('');

  // Generate dialog
  const [generateOpen, setGenerateOpen] = useState(false);

  const { toast } = useToast();

  const { data: config } = useDuesConfigQuery();
  const { data: summary } = useDuesSummaryQuery(month, year);
  const { data: payments = [], isLoading } = useDuesPaymentsQuery();
  const { data: debtors = [] } = useDebtorsQuery();

  const setConfig = useSetDuesConfig();
  const generateDues = useGenerateDues();
  const updatePayment = useUpdateDuesPayment();

  // Filter payments for selected month/year
  const monthPayments = useMemo(() => {
    return payments.filter(p => p.month === month && p.year === year);
  }, [payments, month, year]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return monthPayments.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (!q) return true;
      const name = `${p.user?.name} ${p.user?.lastName}`.toLowerCase();
      const house = p.house?.houseNumber?.toLowerCase() ?? '';
      const email = p.user?.email?.toLowerCase() ?? '';
      return name.includes(q) || house.includes(q) || email.includes(q);
    });
  }, [monthPayments, search, statusFilter]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setPage(1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setPage(1);
  };

  const handleMarkPaid = (payment: DuesPayment) => {
    const isPaid = payment.status === 'paid';
    updatePayment.mutate({
      id: payment.id,
      data: {
        status: isPaid ? 'pending' : 'paid',
        paidAt: isPaid ? null : new Date().toISOString(),
      },
    }, {
      onSuccess: () => toast({ title: isPaid ? 'Pago revertido' : 'Marcado como pagado' }),
      onError: () => toast({ title: 'Error al actualizar', variant: 'destructive' }),
    });
  };

  const handleSetConfig = () => {
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Monto inválido', variant: 'destructive' });
      return;
    }
    setConfig.mutate({ amount }, {
      onSuccess: () => {
        toast({ title: 'Configuración actualizada' });
        setConfigOpen(false);
      },
      onError: () => toast({ title: 'Error al guardar', variant: 'destructive' }),
    });
  };

  const handleGenerate = () => {
    generateDues.mutate({ month, year }, {
      onSuccess: (result) => {
        toast({ title: `Generadas ${result.generated} cuotas (${result.exempt} exentas)` });
        setGenerateOpen(false);
      },
      onError: (err: any) => {
        toast({
          title: 'Error al generar',
          description: err?.response?.data?.message ?? 'Error desconocido',
          variant: 'destructive',
        });
      },
    });
  };

  const collectionRate = summary && summary.totalAmount > 0
    ? Math.round((summary.collectedAmount / summary.totalAmount) * 100)
    : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-title text-3xl font-bold">Cuotas</h1>
            <p className="mt-1 text-muted-foreground">
              Gestión de pagos mensuales del condominio
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => { setNewAmount(config?.amount ?? ''); setConfigOpen(true); }}>
              <Settings className="h-4 w-4" />
              Configurar monto
            </Button>
            <Button size="sm" className="gap-2" onClick={() => setGenerateOpen(true)}>
              <RefreshCw className="h-4 w-4" />
              Generar cuotas
            </Button>
          </div>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="min-w-[160px] text-center font-title font-semibold text-lg capitalize">
            {MONTH_NAMES[month]} {year}
          </span>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-5 w-5" />
          </Button>
          {config && (
            <span className="ml-2 rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
              ${Number(config.amount).toLocaleString('es-MX')} / mes
            </span>
          )}
        </div>

        {/* Summary KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total registros</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.total ?? '—'}</div>
              <p className="text-xs text-muted-foreground">
                ${summary ? Number(summary.totalAmount).toLocaleString('es-MX') : '—'} esperado
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pagados</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{summary?.paid ?? '—'}</div>
              <p className="text-xs text-muted-foreground">
                ${summary ? Number(summary.collectedAmount).toLocaleString('es-MX') : '—'} cobrado
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{summary?.pending ?? '—'}</div>
              <p className="text-xs text-muted-foreground">
                ${summary ? ((summary.total - summary.paid - summary.exempt) * Number(config?.amount ?? 0)).toLocaleString('es-MX') : '—'} pendiente
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cobranza</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{collectionRate}%</div>
              <div className="mt-1 h-1.5 rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${collectionRate}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content tabs */}
        <Tabs defaultValue="payments">
          <TabsList>
            <TabsTrigger value="payments">Pagos ({monthPayments.length})</TabsTrigger>
            <TabsTrigger value="debtors">
              Morosos
              {debtors.length > 0 && (
                <span className="ml-2 rounded-full bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive">
                  {debtors.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Payments tab */}
          <TabsContent value="payments" className="mt-4 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar vecino, casa o correo..."
                  className="pl-9"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <Select value={statusFilter} onValueChange={(v: any) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="paid">Pagados</SelectItem>
                  <SelectItem value="exempt">Exentos</SelectItem>
                  <SelectItem value="overdue">Vencidos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : monthPayments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <DollarSign className="h-12 w-12 text-muted-foreground/40" />
                  <p className="mt-4 font-medium">Sin cuotas para este mes</p>
                  <p className="text-sm text-muted-foreground">Usa "Generar cuotas" para crear los registros del mes.</p>
                  <Button className="mt-4" onClick={() => setGenerateOpen(true)}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Generar cuotas
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vecino</TableHead>
                      <TableHead className="hidden md:table-cell">Casa</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="hidden lg:table-cell">Pagado el</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginate(filtered, page, pageSize).map(p => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="font-medium">{p.user?.name} {p.user?.lastName}</div>
                          <div className="text-xs text-muted-foreground">{p.user?.email}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {p.house?.houseNumber
                            ? <span className="font-mono text-sm">{p.house.houseNumber}</span>
                            : <span className="text-muted-foreground">—</span>
                          }
                        </TableCell>
                        <TableCell>${Number(p.amount).toLocaleString('es-MX')}</TableCell>
                        <TableCell>
                          <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusColors[p.status])}>
                            {statusLabels[p.status]}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {p.paidAt ? format(new Date(p.paidAt), "d MMM yyyy", { locale: es }) : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {p.status !== 'exempt' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                'text-xs',
                                p.status === 'paid'
                                  ? 'text-muted-foreground hover:text-foreground'
                                  : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50',
                              )}
                              onClick={() => handleMarkPaid(p)}
                              disabled={updatePayment.isPending}
                            >
                              {p.status === 'paid' ? 'Revertir' : 'Marcar pagado'}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination
                  totalItems={filtered.length}
                  page={page}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              </Card>
            )}
          </TabsContent>

          {/* Debtors tab */}
          <TabsContent value="debtors" className="mt-4">
            {debtors.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500/40" />
                  <p className="mt-4 font-medium">Sin morosos</p>
                  <p className="text-sm text-muted-foreground">Todos los vecinos están al corriente.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vecino</TableHead>
                      <TableHead className="hidden md:table-cell">Casa</TableHead>
                      <TableHead>Meses</TableHead>
                      <TableHead className="hidden lg:table-cell">Acceso</TableHead>
                      <TableHead>Monto adeudado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {debtors.map(d => {
                      const total = d.pendingPayments.reduce((s, p) => s + p.amount, 0);
                      return (
                        <TableRow key={d.userId}>
                          <TableCell>
                            <div className="font-medium">{d.userName}</div>
                            <div className="text-xs text-muted-foreground">{d.userEmail}</div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <span className="font-mono text-sm">{d.houseNumber}</span>
                            {d.houseAddress && (
                              <div className="text-xs text-muted-foreground">{d.houseAddress}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                              {d.pendingMonths} {d.pendingMonths === 1 ? 'mes' : 'meses'}
                            </span>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <span className={cn(
                              'text-xs font-medium',
                              d.accessStatus === 'active' ? 'text-emerald-600' : 'text-destructive',
                            )}>
                              {d.accessStatus === 'active' ? 'Activo' : 'Suspendido'}
                            </span>
                          </TableCell>
                          <TableCell className="font-semibold text-destructive">
                            ${total.toLocaleString('es-MX')}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Configure Amount Dialog */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Configurar monto de cuota</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Monto mensual (MXN)</Label>
              <Input
                type="number"
                min="0"
                step="50"
                placeholder="300"
                value={newAmount}
                onChange={e => setNewAmount(e.target.value)}
              />
              {config && (
                <p className="text-xs text-muted-foreground">
                  Monto actual: ${Number(config.amount).toLocaleString('es-MX')}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigOpen(false)}>Cancelar</Button>
            <Button onClick={handleSetConfig} disabled={setConfig.isPending}>
              {setConfig.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Dues Dialog */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Generar cuotas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Se crearán registros de cuota para todos los vecinos activos en{' '}
              <strong className="capitalize">{MONTH_NAMES[month]} {year}</strong>.
            </p>
            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <Label>Mes</Label>
                <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.slice(1).map((name, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-1">
                <Label>Año</Label>
                <Input
                  type="number"
                  value={year}
                  onChange={e => setYear(Number(e.target.value))}
                  min={2024}
                  max={2030}
                />
              </div>
            </div>
            {!config && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Sin configuración de monto. Configura el monto primero.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateOpen(false)}>Cancelar</Button>
            <Button onClick={handleGenerate} disabled={generateDues.isPending || !config}>
              {generateDues.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Generar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
