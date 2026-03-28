import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { useMeetingsQuery, useEventsQuery, useHousesQuery, useUsersQuery } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, TreePine, Home, Users, Shield, TrendingUp, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ADMIN_ROLES } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'PLATFORM_ADMIN') {
      navigate('/admin/platform', { replace: true });
    }
  }, [user, navigate]);

  const { data: meetings = [] } = useMeetingsQuery();
  const { data: events = [] } = useEventsQuery();
  const { data: houses = [] } = useHousesQuery();
  const { data: users = [] } = useUsersQuery();

  const today = new Date().toISOString().split('T')[0];
  const upcomingMeetings = meetings.filter(m => m.date >= today);
  const upcomingEvents = events.filter(e => e.date >= today);
  const activeHouses = houses.filter(h => h.status === 'active');
  const admins = users.filter(u => ADMIN_ROLES.includes(u.role));
  const vecinos = users.filter(u => u.role === 'RESIDENT');

  const stats = [
    { label: 'Reuniones', value: meetings.length, sub: `${upcomingMeetings.length} próximas`, icon: Calendar, color: 'text-primary' },
    { label: 'Eventos', value: events.length, sub: `${upcomingEvents.length} próximos`, icon: TreePine, color: 'text-accent-foreground' },
    { label: 'Casas', value: houses.length, sub: `${activeHouses.length} activas`, icon: Home, color: 'text-park-brown' },
    { label: 'Usuarios', value: users.length, sub: `${admins.length} admin · ${vecinos.length} vecinos`, icon: Users, color: 'text-park-orange' },
  ];

  // Data for bar chart - activities per module
  const barData = [
    { name: 'Reuniones', total: meetings.length, proximas: upcomingMeetings.length },
    { name: 'Eventos', total: events.length, proximas: upcomingEvents.length },
  ];

  // Data for pie chart - house status
  const houseStatusData = [
    { name: 'Activas', value: activeHouses.length },
    { name: 'Inactivas', value: houses.length - activeHouses.length },
  ];
  const HOUSE_COLORS = ['hsl(var(--primary))', 'hsl(var(--muted-foreground))'];

  // Data for pie chart - user roles
  const userRoleData = [
    { name: 'Administradores', value: admins.length },
    { name: 'Vecinos', value: vecinos.length },
  ];
  const USER_COLORS = ['hsl(var(--park-orange))', 'hsl(var(--primary))'];

  // Upcoming items sorted by date
  const upcoming = [
    ...upcomingMeetings.map(m => ({ type: 'Reunión' as const, title: m.title, date: m.date, time: m.startTime })),
    ...upcomingEvents.map(e => ({ type: 'Evento' as const, title: e.title, date: e.date, time: e.startTime })),
  ].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).slice(0, 5);

  // Green area usage
  const areaUsage = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.greenArea] = (acc[e.greenArea] || 0) + 1;
    return acc;
  }, {});
  const areaData = Object.entries(areaUsage)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Resumen general del fraccionamiento</p>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map(stat => (
            <Card key={stat.label} className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Bar Chart - Actividades */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-serif text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" /> Actividades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="total" name="Total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="proximas" name="Próximas" fill="hsl(var(--park-orange))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Charts */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-serif text-lg flex items-center gap-2">
                <Home className="h-5 w-5 text-park-brown" /> Casas y Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-center text-muted-foreground mb-1">Casas</p>
                  <ResponsiveContainer width="100%" height={170}>
                    <PieChart>
                      <Pie data={houseStatusData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" paddingAngle={3}>
                        {houseStatusData.map((_, i) => <Cell key={i} fill={HOUSE_COLORS[i]} />)}
                      </Pie>
                      <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                      <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="text-xs text-center text-muted-foreground mb-1">Usuarios</p>
                  <ResponsiveContainer width="100%" height={170}>
                    <PieChart>
                      <Pie data={userRoleData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" paddingAngle={3}>
                        {userRoleData.map((_, i) => <Cell key={i} fill={USER_COLORS[i]} />)}
                      </Pie>
                      <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                      <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Upcoming */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-serif text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" /> Próximos Eventos y Reuniones
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No hay actividades próximas.</p>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((item, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <Badge variant={item.type === 'Reunión' ? 'default' : 'secondary'}>{item.type}</Badge>
                        <span className="text-sm font-medium">{item.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{item.date} · {item.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Green Area Usage */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-serif text-lg flex items-center gap-2">
                <TreePine className="h-5 w-5 text-primary" /> Uso de Áreas Verdes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {areaData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Sin datos de uso.</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={areaData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" allowDecimals={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                    <YAxis type="category" dataKey="name" width={120} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                    <Bar dataKey="count" name="Eventos" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
