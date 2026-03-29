import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

interface TenantGuardProps {
  children: React.ReactNode;
}

/**
 * For PLATFORM_ADMIN: shows a residencial selector if no tenant is active.
 * Regular admins (CONDO_ADMIN, PRESIDENTE, etc.) pass through directly.
 */
export function TenantGuard({ children }: TenantGuardProps) {
  const { user } = useAuth();
  const { tenantId, setTenantId, condominiums } = useTenant();

  // Non-platform admins always see their own condo data
  if (user?.role !== 'PLATFORM_ADMIN') return <>{children}</>;

  // Platform admin has selected a condo → show data
  if (tenantId) return <>{children}</>;

  // No condo selected → show selector
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
        <Building2 className="h-8 w-8 text-accent" />
      </div>
      <h2 className="font-title text-2xl font-bold text-foreground">Selecciona un residencial</h2>
      <p className="mt-2 text-muted-foreground">
        Elige el condominio cuyos datos quieres gestionar.
      </p>

      <div className="mt-8 grid gap-3 w-full max-w-sm">
        {condominiums.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">Sin condominios registrados.</p>
        ) : (
          condominiums.map(c => (
            <Card
              key={c.id}
              className="cursor-pointer border-2 border-transparent transition-all hover:border-primary hover:shadow-md"
              onClick={() => setTenantId(c.id)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {c.status} · {c.city ?? 'Sin ciudad'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Button
        variant="ghost"
        className="mt-6 text-sm text-muted-foreground"
        onClick={() => setTenantId(null)}
      >
        Ver todos los condominios
      </Button>
    </div>
  );
}
