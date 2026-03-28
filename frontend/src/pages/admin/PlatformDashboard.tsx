import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2, Users, Home, AlertTriangle, TrendingUp,
  CheckCircle, Clock, XCircle, Loader2, ArrowRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';

interface PlatformStats {
  totals: { condominiums: number; users: number; houses: number };
  byStatus: Record<string, number>;
  trialsExpiringSoon: Array<{
    id: string; name: string; trialEndsAt: string;
  }>;
  monthlyGrowth: Array<{ month: string; count: number }>;
  perCondominium: Array<{
    id: string; name: string; slug: string; status: string;
    city: string | null; trialEndsAt: string | null;
    createdAt: string; userCount: number; houseCount: number;
  }>;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  active:    { label: 'Activo',     color: 'hsl(142 71% 45%)',  icon: CheckCircle },
  trial:     { label: 'Prueba',     color: 'hsl(14 91% 62%)',   icon: Clock },
  suspended: { label: 'Suspendido', color: 'hsl(43 96% 56%)',   icon: AlertTriangle },
  cancelled: { label: 'Cancelado',  color: 'hsl(0 84% 60%)',    icon: XCircle },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: '#888', icon: Building2 };
  const variants: Record<string, 'default'|'secondary'|'destructive'|'outline'> = {
    active: 'default', trial: 'secondary', suspended: 'outline', cancelled: 'destructive',
  };
  return <Badge variant={variants[status] ?? 'outline'}>{cfg.label}</Badge>;
}

export default function PlatformDashboard() {
  const { data: stats, isLoading } = useQuery<PlatformStats>({
    queryKey: ['platform-stats'],
    queryFn: () => api.get<PlatformStats>('/condominiums/stats').then(r => r.data),
    refetchInterval: 60_000,
  });

  if (isLoading || !stats) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const statusPieData = Object.entries(stats.byStatus)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: STATUS_CONFIG[k]?.label ?? k, value: v, color: STATUS_CONFIG[k]?.color ?? '#888' }));

  const kpiCards = [
    {
      label: 'Condominios',
      value: stats.totals.condominiums,
      sub: `${stats.byStatus.active ?? 0} activos`,
      icon: Building2,
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
    {
      label: 'Usuarios totales',
      value: stats.totals.users,
      sub: 'en todos los condominios',
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Casas registradas',
      value: stats.totals.houses,
      sub: 'en todos los condominios',
      icon: Home,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Pruebas activas',
      value: stats.byStatus.trial ?? 0,
      sub: stats.trialsExpiringSoon.length > 0
        ? `${stats.trialsExpiringSoon.length} vencen pronto`
        : 'Sin vencimientos próximos',
      icon: Clock,
      color: stats.trialsExpiringSoon.length > 0 ? 'text-orange-500' : 'text-primary',
      bg: stats.trialsExpiringSoon.length > 0 ? 'bg-orange-50' : 'bg-primary/10',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-title text-3xl font-bold text-accent">Platform Dashboard</h1>
            <p className="text-muted-foreground">Niddo SaaS — métricas de negocio</p>
          </div>
          <Link to="/admin/condominios">
            <Button className="gap-2">
              <Building2 className="h-4 w-4" /> Gestionar condominios <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map(kpi => (
            <Card key={kpi.label} className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${kpi.bg}`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="font-title text-3xl font-bold">{kpi.value}</div>
                <p className="mt-1 text-xs text-muted-foreground">{kpi.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Monthly growth bar chart */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-title text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Nuevos condominios por mes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.monthlyGrowth.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Sin datos suficientes</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.monthlyGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <YAxis allowDecimals={false} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" name="Condominios" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Status pie chart */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-title text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-accent" /> Distribución por estado
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              {statusPieData.length === 0 ? (
                <p className="py-8 text-sm text-muted-foreground">Sin condominios</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {statusPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Legend iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                    <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Trials expiring soon */}
        {stats.trialsExpiringSoon.length > 0 && (
          <Card className="shadow-card border-orange-200">
            <CardHeader>
              <CardTitle className="font-title text-base flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-4 w-4" /> Pruebas por vencer (próximos 7 días)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.trialsExpiringSoon.map(t => (
                  <div key={t.id} className="flex items-center justify-between rounded-lg border border-orange-100 bg-orange-50 px-4 py-2.5">
                    <span className="font-medium text-sm">{t.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-orange-600">
                        Vence: {t.trialEndsAt ? format(new Date(t.trialEndsAt), "dd MMM yyyy", { locale: es }) : '—'}
                      </span>
                      <Link to={`/admin/condominios`}>
                        <Button size="sm" variant="outline" className="h-7 text-xs border-orange-300 text-orange-600 hover:bg-orange-100">
                          Gestionar
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All condominiums summary table */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-title text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-accent" /> Todos los condominios
            </CardTitle>
            <Link to="/admin/condominios">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                Ver todos <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Condominio</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Usuarios</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Casas</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Vence prueba</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Registro</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.perCondominium.map(c => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.city ?? c.slug}</div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3 text-center font-medium">{c.userCount}</td>
                      <td className="px-4 py-3 text-center font-medium">{c.houseCount}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">
                        {c.trialEndsAt ? format(new Date(c.trialEndsAt), 'dd MMM yyyy', { locale: es }) : '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">
                        {format(new Date(c.createdAt), 'dd MMM yyyy', { locale: es })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
