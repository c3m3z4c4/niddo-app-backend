import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  LayoutDashboard,
  Users,
  FileText,
  Bell,
  ShieldCheck,
  Smartphone,
  ChevronRight,
} from 'lucide-react';

const features = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard en tiempo real',
    description: 'Visualiza el estado de tu condominio con métricas claras y actualizadas al instante.',
  },
  {
    icon: Users,
    title: 'Gestión de residentes',
    description: 'Directorio de casas, residentes y roles administrativos en un solo lugar.',
  },
  {
    icon: FileText,
    title: 'Reuniones y actas',
    description: 'Convoca asambleas, registra acuerdos y comparte actas de forma automática.',
  },
  {
    icon: Bell,
    title: 'Notificaciones inteligentes',
    description: 'Mantén informada a tu comunidad con avisos segmentados por casa o rol.',
  },
  {
    icon: ShieldCheck,
    title: 'Roles y permisos',
    description: 'Presidente, tesorero, secretario y vecinos — cada uno con su nivel de acceso.',
  },
  {
    icon: Smartphone,
    title: 'Diseño responsivo',
    description: 'Accede desde cualquier dispositivo. La experiencia se adapta a tu pantalla.',
  },
];

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-background">

      {/* ── Navbar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <span className="font-title font-bold text-2xl text-accent">Niddo</span>
          <Link to="/login">
            <Button size="sm">Iniciar sesión <ChevronRight className="ml-1 h-4 w-4" /></Button>
          </Link>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="container flex flex-col items-center gap-8 py-24 text-center md:py-32">
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-accent">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          Plataforma SaaS para condominios
        </div>

        <h1 className="font-title max-w-3xl text-5xl font-bold leading-tight tracking-tight text-accent md:text-6xl">
          Paz vecinal y finanzas claras{' '}
          <span className="text-primary">en un solo lugar</span>
        </h1>

        <p className="max-w-xl text-lg text-muted-foreground">
          Niddo centraliza la gestión de tu condominio: reuniones, eventos, cuotas y comunicación
          — todo en una plataforma moderna y fácil de usar.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link to="/login">
            <Button size="lg" className="gap-2 px-8 text-base">
              Comenzar ahora <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline" className="px-8 text-base">
              Ver demo
            </Button>
          </Link>
        </div>

        {/* Decorative gradient blob */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-32 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        />
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section className="bg-muted/40 py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="font-title text-3xl font-bold text-accent md:text-4xl">
              Todo lo que necesita tu comunidad
            </h2>
            <p className="mt-3 text-muted-foreground">
              Diseñado para que administradores y residentes trabajen en armonía.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="card-hover border-border/60 shadow-sm">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-title mb-2 font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────── */}
      <section className="container py-20 text-center">
        <div className="mx-auto max-w-2xl rounded-2xl bg-accent px-8 py-14">
          <h2 className="font-title text-3xl font-bold text-white md:text-4xl">
            Tu condominio en armonía
          </h2>
          <p className="mt-3 text-white/80">
            Únete a las comunidades que ya confían en Niddo para su gestión diaria.
          </p>
          <Link to="/login" className="mt-8 inline-block">
            <Button size="lg" variant="secondary" className="px-10 text-base font-semibold">
              Acceder a la plataforma
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t py-8">
        <div className="container flex flex-col items-center gap-2 text-center text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <span className="font-title font-semibold text-accent">Niddo</span>
          <p>© 2026 Niddo. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
