import { VecinoLayout } from '@/components/layouts/VecinoLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useHousesQuery } from '@/hooks/useApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Home, Mail, Shield } from 'lucide-react';

const roleLabels: Record<string, string> = {
  RESIDENT: 'Vecino',
  CONDO_ADMIN: 'Administrador',
  PRESIDENTE: 'Presidente',
  SECRETARIO: 'Secretario',
  TESORERO: 'Tesorero',
  PLATFORM_ADMIN: 'Plataforma',
};

export default function VecinoProfile() {
  const { user } = useAuth();
  const { data: houses = [] } = useHousesQuery();

  // Find the house where this user is a resident
  const userHouse = houses.find(h => h.residents?.some(r => r.id === user?.id))
    ?? (user?.houseId ? houses.find(h => h.id === user.houseId) : null);

  return (
    <VecinoLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold">Mi Perfil</h1>
          <p className="mt-1 text-muted-foreground">
            Información de tu cuenta y vivienda
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* User Info Card */}
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                  <User className="h-8 w-8 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-xl">{user?.name} {user?.lastName}</CardTitle>
                  <CardDescription>Residente</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Correo electrónico</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <Shield className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm font-medium">Rol</p>
                  <p className="text-sm text-muted-foreground">
                    {roleLabels[user?.role ?? ''] ?? user?.role}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* House Info Card */}
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                  <Home className="h-8 w-8 text-accent-foreground" />
                </div>
                <div>
                  <CardTitle className="text-xl">Mi Vivienda</CardTitle>
                  <CardDescription>Información de tu propiedad</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {userHouse ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm font-medium">Número de casa</p>
                    <p className="text-2xl font-bold text-primary">{userHouse.houseNumber}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-sm font-medium">Estado</p>
                      <p className={`text-sm font-medium ${userHouse.status === 'active' ? 'text-primary' : 'text-destructive'}`}>
                        {userHouse.status === 'active' ? 'Activo' : 'Inactivo'}
                      </p>
                    </div>
                    {userHouse.type && (
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-sm font-medium">Tipo</p>
                        <p className="text-sm text-muted-foreground capitalize">{userHouse.type.replace('_', ' ')}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Home className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">
                    No tienes una vivienda asignada
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </VecinoLayout>
  );
}
