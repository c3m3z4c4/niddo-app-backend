import { useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { useTenant } from '@/contexts/TenantContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertTriangle, Trash2, Download, Building2, Users, DollarSign,
  Calendar, TreePine, Shield, Loader2, CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface DeleteAction {
  key: string;
  label: string;
  description: string;
  endpoint: string;
  icon: typeof Trash2;
  color: string;
}

const DELETE_ACTIONS: DeleteAction[] = [
  {
    key: 'payments',
    label: 'Pagos / Cuotas',
    description: 'Elimina todos los registros de pagos del residencial seleccionado.',
    endpoint: '/dues/all',
    icon: DollarSign,
    color: 'text-amber-600',
  },
  {
    key: 'residents',
    label: 'Residentes',
    description: 'Elimina todos los usuarios con rol RESIDENT del residencial.',
    endpoint: '/users/all-residents',
    icon: Users,
    color: 'text-blue-600',
  },
  {
    key: 'meetings',
    label: 'Reuniones',
    description: 'Elimina todas las reuniones y sus actas del residencial.',
    endpoint: '/meetings/all',
    icon: Calendar,
    color: 'text-purple-600',
  },
  {
    key: 'events',
    label: 'Eventos de áreas verdes',
    description: 'Elimina todos los eventos del residencial.',
    endpoint: '/events/all',
    icon: TreePine,
    color: 'text-emerald-600',
  },
];

interface ConfirmState {
  action: DeleteAction;
  step: 1 | 2;
  confirmText: string;
}

export default function AdminDataManagement() {
  const { tenantId, condominiums } = useTenant();
  const { toast } = useToast();
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [loading, setLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);

  const currentCondo = condominiums.find(c => c.id === tenantId);
  const CONFIRM_PHRASE = currentCondo?.name?.toUpperCase() ?? 'CONFIRMAR';

  const openConfirm = (action: DeleteAction) => {
    setConfirm({ action, step: 1, confirmText: '' });
  };

  const handleDelete = async () => {
    if (!confirm) return;
    setLoading(true);
    try {
      const res = await api.delete(confirm.action.endpoint);
      const deleted = (res.data as any)?.deleted ?? '?';
      toast({
        title: `${confirm.action.label} eliminados`,
        description: `Se eliminaron ${deleted} registros.`,
      });
      setConfirm(null);
    } catch (err: any) {
      toast({
        title: 'Error al eliminar',
        description: err?.response?.data?.message ?? 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      await api.post('/backup/trigger');
      toast({ title: 'Respaldo generado', description: 'El respaldo se creó exitosamente.' });
    } catch (err: any) {
      toast({
        title: 'Error al respaldar',
        description: err?.response?.data?.message ?? 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setBackupLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-destructive" />
            <h1 className="font-title text-3xl font-bold">Gestión de datos</h1>
          </div>
          <p className="mt-1 text-muted-foreground">
            Operaciones de respaldo y limpieza de datos. Exclusivo para administradores de Niddo.
          </p>
        </div>

        {/* Tenant indicator */}
        <Card className={cn(
          'border-2',
          tenantId ? 'border-primary/30 bg-primary/5' : 'border-amber-300 bg-amber-50 dark:bg-amber-900/10',
        )}>
          <CardContent className="flex items-center gap-3 p-4">
            <Building2 className={cn('h-5 w-5', tenantId ? 'text-primary' : 'text-amber-600')} />
            {tenantId && currentCondo ? (
              <div>
                <p className="font-semibold">{currentCondo.name}</p>
                <p className="text-xs text-muted-foreground">
                  Las operaciones afectarán únicamente este residencial.
                </p>
              </div>
            ) : (
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-400">Sin residencial seleccionado</p>
                <p className="text-xs text-amber-700 dark:text-amber-500">
                  Selecciona un residencial desde el selector en el menú lateral. Las operaciones de limpieza no están disponibles sin residencial activo.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Backup section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Download className="h-5 w-5 text-primary" />
              Respaldo de base de datos
            </CardTitle>
            <CardDescription>
              Genera un respaldo SQL completo de toda la base de datos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleBackup}
              disabled={backupLoading}
            >
              {backupLoading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Download className="h-4 w-4" />
              }
              Generar respaldo ahora
            </Button>
          </CardContent>
        </Card>

        {/* Danger zone */}
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Zona de peligro
            </CardTitle>
            <CardDescription>
              Estas acciones son <strong>irreversibles</strong>. Se requiere doble confirmación.
              {!tenantId && (
                <span className="mt-1 block text-amber-600">
                  Selecciona un residencial para habilitar estas acciones.
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {DELETE_ACTIONS.map(action => {
              const Icon = action.icon;
              return (
                <div
                  key={action.key}
                  className="flex items-start justify-between rounded-lg border p-4"
                >
                  <div className="flex items-start gap-3">
                    <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', action.color)} />
                    <div>
                      <p className="font-medium">{action.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="ml-3 shrink-0"
                    disabled={!tenantId}
                    onClick={() => openConfirm(action)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Double-confirmation dialog */}
      {confirm && (
        <Dialog open onOpenChange={() => setConfirm(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                {confirm.step === 1 ? 'Primera confirmación' : 'Confirma escribiendo el nombre'}
              </DialogTitle>
              <DialogDescription>
                Estás a punto de eliminar <strong>{confirm.action.label}</strong> de{' '}
                <strong>{currentCondo?.name}</strong>.
                Esta acción es <strong>permanente e irreversible</strong>.
              </DialogDescription>
            </DialogHeader>

            {confirm.step === 1 ? (
              <div className="space-y-4 py-2">
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <p className="font-medium">¿Estás seguro?</p>
                  <p className="mt-1">{confirm.action.description}</p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setConfirm(null)}>Cancelar</Button>
                  <Button
                    variant="destructive"
                    onClick={() => setConfirm(c => c ? { ...c, step: 2 } : c)}
                  >
                    Sí, continuar
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>
                    Escribe <code className="rounded bg-muted px-1 py-0.5 font-mono text-sm">{CONFIRM_PHRASE}</code> para confirmar:
                  </Label>
                  <Input
                    placeholder={CONFIRM_PHRASE}
                    value={confirm.confirmText}
                    onChange={e => setConfirm(c => c ? { ...c, confirmText: e.target.value } : c)}
                    className="font-mono"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setConfirm(null)}>Cancelar</Button>
                  <Button
                    variant="destructive"
                    disabled={confirm.confirmText !== CONFIRM_PHRASE || loading}
                    onClick={handleDelete}
                  >
                    {loading
                      ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      : <Trash2 className="mr-2 h-4 w-4" />
                    }
                    Eliminar permanentemente
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </AdminLayout>
  );
}
