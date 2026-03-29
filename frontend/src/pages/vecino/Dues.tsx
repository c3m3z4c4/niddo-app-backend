import { VecinoLayout } from '@/components/layouts/VecinoLayout';
import { useDuesPaymentsQuery, useDuesConfigQuery } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { PaymentStatus } from '@/types';
import { Loader2 } from 'lucide-react';

const MONTH_NAMES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const statusConfig: Record<PaymentStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  paid: { label: 'Pagado', icon: CheckCircle2, className: 'text-emerald-600' },
  pending: { label: 'Pendiente', icon: Clock, className: 'text-amber-600' },
  overdue: { label: 'Vencido', icon: AlertCircle, className: 'text-destructive' },
  exempt: { label: 'Exento', icon: CheckCircle2, className: 'text-blue-600' },
};

export default function VecinoDues() {
  const { data: payments = [], isLoading } = useDuesPaymentsQuery();
  const { data: config } = useDuesConfigQuery();

  const sorted = [...payments].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return b.month - a.month;
  });

  const paid = payments.filter(p => p.status === 'paid').length;
  const pending = payments.filter(p => p.status === 'pending' || p.status === 'overdue').length;

  if (isLoading) {
    return (
      <VecinoLayout>
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </VecinoLayout>
    );
  }

  return (
    <VecinoLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold">Mis Cuotas</h1>
          <p className="mt-1 text-muted-foreground">
            Historial de pagos de mantenimiento mensual
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monto mensual</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {config ? `$${Number(config.amount).toLocaleString('es-MX')}` : '—'}
              </div>
              <p className="text-xs text-muted-foreground">por mes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pagados</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{paid}</div>
              <p className="text-xs text-muted-foreground">meses cubiertos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className={cn('text-2xl font-bold', pending > 0 ? 'text-amber-600' : 'text-foreground')}>
                {pending}
              </div>
              <p className="text-xs text-muted-foreground">meses sin pago</p>
            </CardContent>
          </Card>
        </div>

        {/* Payment history */}
        {payments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground/40" />
              <p className="mt-4 font-medium">Sin registros de cuotas</p>
              <p className="text-sm text-muted-foreground">
                Los registros aparecerán aquí cuando el administrador genere las cuotas del mes.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sorted.map(p => {
              const sc = statusConfig[p.status];
              const Icon = sc.icon;
              return (
                <Card key={p.id} className={cn(
                  'shadow-sm transition-shadow hover:shadow-md',
                  p.status === 'overdue' && 'border-destructive/40',
                )}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full',
                        p.status === 'paid' ? 'bg-emerald-100' :
                        p.status === 'exempt' ? 'bg-blue-100' :
                        p.status === 'overdue' ? 'bg-red-100' : 'bg-amber-100',
                      )}>
                        <Icon className={cn('h-5 w-5', sc.className)} />
                      </div>
                      <div>
                        <p className="font-medium capitalize">
                          {MONTH_NAMES[p.month]} {p.year}
                        </p>
                        {p.paidAt && (
                          <p className="text-xs text-muted-foreground">
                            Pagado el {format(new Date(p.paidAt), "d 'de' MMMM yyyy", { locale: es })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {p.status === 'exempt' ? 'Exento' : `$${Number(p.amount).toLocaleString('es-MX')}`}
                      </p>
                      <p className={cn('text-xs font-medium', sc.className)}>{sc.label}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </VecinoLayout>
  );
}
