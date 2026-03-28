import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Building2, Plus, Pencil, Search, Loader2, CalendarClock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Condominium } from '@/types';

interface CondominiumForm {
  name: string;
  slug: string;
  city: string;
  state: string;
  contactEmail: string;
  phone: string;
  status: 'active' | 'trial' | 'suspended' | 'cancelled';
  trialEndsAt: string; // YYYY-MM-DD input
  maxHouses: string;
  maxUsers: string;
}

const EMPTY_FORM: CondominiumForm = {
  name: '', slug: '', city: '', state: '', contactEmail: '', phone: '',
  status: 'trial', trialEndsAt: '', maxHouses: '', maxUsers: '',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo', trial: 'Prueba', suspended: 'Suspendido', cancelled: 'Cancelado',
};

const STATUS_VARIANTS: Record<string, 'default'|'secondary'|'destructive'|'outline'> = {
  active: 'default', trial: 'secondary', suspended: 'outline', cancelled: 'destructive',
};

export default function AdminCondominiums() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CondominiumForm>(EMPTY_FORM);
  const [trialDialogId, setTrialDialogId] = useState<string | null>(null);
  const [trialDays, setTrialDays] = useState('30');

  const { data: condominiums = [], isLoading } = useQuery<Condominium[]>({
    queryKey: ['condominiums'],
    queryFn: () => api.get<Condominium[]>('/condominiums').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/condominiums', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['condominiums'] }); qc.invalidateQueries({ queryKey: ['platform-stats'] }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.patch(`/condominiums/${id}`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['condominiums'] }); qc.invalidateQueries({ queryKey: ['platform-stats'] }); },
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const handleOpenEdit = (c: Condominium) => {
    setEditingId(c.id);
    setForm({
      name: c.name, slug: c.slug,
      city: c.city ?? '', state: c.state ?? '',
      contactEmail: c.contactEmail ?? '', phone: c.phone ?? '',
      status: c.status,
      trialEndsAt: c.trialEndsAt ? new Date(c.trialEndsAt).toISOString().split('T')[0] : '',
      maxHouses: c.maxHouses != null ? String(c.maxHouses) : '',
      maxUsers: c.maxUsers != null ? String(c.maxUsers) : '',
    });
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      name: form.name, slug: form.slug,
      city: form.city || null, state: form.state || null,
      contactEmail: form.contactEmail || null, phone: form.phone || null,
      status: form.status,
      trialEndsAt: form.trialEndsAt ? new Date(form.trialEndsAt).toISOString() : null,
      maxHouses: form.maxHouses ? Number(form.maxHouses) : null,
      maxUsers: form.maxUsers ? Number(form.maxUsers) : null,
    };
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
        toast({ title: 'Condominio actualizado' });
      } else {
        await createMutation.mutateAsync(payload);
        toast({ title: 'Condominio creado' });
      }
      setFormOpen(false);
    } catch {
      toast({ title: 'Error', description: 'No se pudo guardar.', variant: 'destructive' });
    }
  };

  const handleGrantTrial = async () => {
    if (!trialDialogId) return;
    const days = Number(trialDays);
    const trialEndsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    try {
      await updateMutation.mutateAsync({ id: trialDialogId, data: { status: 'trial', trialEndsAt } });
      toast({ title: `Período de prueba de ${days} días otorgado` });
      setTrialDialogId(null);
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const filtered = condominiums.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-title text-3xl font-bold text-accent">Condominios</h1>
            <p className="text-muted-foreground">{condominiums.length} tenants registrados</p>
          </div>
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Nuevo condominio
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card className="shadow-card">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Condominio</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Ciudad</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Vence prueba</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Límites</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(c => (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <div className="font-medium">{c.name}</div>
                          <div className="text-xs text-muted-foreground">{c.slug}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={STATUS_VARIANTS[c.status] ?? 'outline'}>
                            {STATUS_LABELS[c.status] ?? c.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{c.city ?? '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">
                          {c.trialEndsAt ? format(new Date(c.trialEndsAt), 'dd MMM yyyy', { locale: es }) : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                          {c.maxHouses != null ? `${c.maxHouses} casas` : '∞'} · {c.maxUsers != null ? `${c.maxUsers} usuarios` : '∞'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" title="Otorgar período de prueba"
                              onClick={() => { setTrialDialogId(c.id); setTrialDays('30'); }}>
                              <CalendarClock className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Editar" onClick={() => handleOpenEdit(c)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-title text-xl">
              {editingId ? 'Editar condominio' : 'Nuevo condominio'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Nombre *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Slug * <span className="text-xs text-muted-foreground">(identificador único)</span></Label>
                <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} required placeholder="mi-condominio" />
              </div>
              <div className="space-y-1.5">
                <Label>Ciudad</Label>
                <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Email de contacto</Label>
                <Input type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Estado de suscripción</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as CondominiumForm['status'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Prueba</SelectItem>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="suspended">Suspendido</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Fin de período de prueba</Label>
                <Input type="date" value={form.trialEndsAt} onChange={e => setForm(f => ({ ...f, trialEndsAt: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Máx. casas</Label>
                <Input type="number" placeholder="Sin límite" value={form.maxHouses} onChange={e => setForm(f => ({ ...f, maxHouses: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Máx. usuarios</Label>
                <Input type="number" placeholder="Sin límite" value={form.maxUsers} onChange={e => setForm(f => ({ ...f, maxUsers: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
              <Button type="submit">{editingId ? 'Guardar cambios' : 'Crear'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Grant trial dialog */}
      <Dialog open={!!trialDialogId} onOpenChange={() => setTrialDialogId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-title text-lg">Otorgar período de prueba</DialogTitle>
            <DialogDescription>El condominio pasará a estado "Prueba" con la duración indicada.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Duración (días)</Label>
            <Input type="number" min="1" max="365" value={trialDays} onChange={e => setTrialDays(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrialDialogId(null)}>Cancelar</Button>
            <Button onClick={handleGrantTrial}>Otorgar prueba</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
