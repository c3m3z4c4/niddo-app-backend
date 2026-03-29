import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Home,
  Calendar,
  CalendarDays,
  TreePine,
  User,
  LogOut,
  Menu,
  X,
  DollarSign,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';
import { NotificationBell } from '@/components/NotificationBell';

const vecinoLinks = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/calendario', label: 'Calendario', icon: CalendarDays },
  { to: '/reuniones', label: 'Reuniones', icon: Calendar },
  { to: '/eventos', label: 'Eventos', icon: TreePine },
  { to: '/cuotas', label: 'Cuotas', icon: DollarSign },
  { to: '/perfil', label: 'Perfil', icon: User },
];

export function VecinoLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card shadow-sm">
        <div className="container flex h-20 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-12 w-12 overflow-hidden rounded-full bg-white p-1 shadow-sm">
              <img 
                src={logo} 
                alt="Privadas del Parque" 
                className="h-full w-full object-contain"
              />
            </div>
            <span className="hidden font-serif text-xl font-semibold text-foreground sm:block">
              Privadas del Parque
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {vecinoLinks.map(link => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link key={link.to} to={link.to}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "gap-2",
                      isActive && "bg-primary text-primary-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Button>
                </Link>
              );
            })}
            <div className="ml-4 flex items-center gap-1 border-l pl-4">
              <NotificationBell />
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-destructive hover:text-destructive">
                <LogOut className="h-4 w-4" />
                Salir
              </Button>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="border-t bg-card p-4 md:hidden">
            <div className="flex flex-col gap-2">
              {vecinoLinks.map(link => {
                const Icon = link.icon;
                const isActive = location.pathname === link.to;
                return (
                  <Link key={link.to} to={link.to} onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-2",
                        isActive && "bg-primary text-primary-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Button>
                  </Link>
                );
              })}
              <div className="mt-2 border-t pt-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </Button>
              </div>
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card py-6">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2024 Privadas del Parque. Todos los derechos reservados.</p>
          <p className="mt-1">Bienvenido, {user?.name}</p>
        </div>
      </footer>
    </div>
  );
}
