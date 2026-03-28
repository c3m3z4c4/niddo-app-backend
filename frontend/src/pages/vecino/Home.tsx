import { VecinoLayout } from '@/components/layouts/VecinoLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useMeetingsQuery, useEventsQuery } from '@/hooks/useApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, TreePine, Clock, MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, parseISO, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';

export default function VecinoHome() {
  const { user } = useAuth();
  const { data: meetings = [] } = useMeetingsQuery();
  const { data: events = [] } = useEventsQuery();

  const today = new Date();
  
  // Get upcoming meetings and events
  const upcomingMeetings = meetings
    .filter(m => isAfter(parseISO(m.date), today) || format(parseISO(m.date), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'))
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
    .slice(0, 3);

  const upcomingEvents = events
    .filter(e => isAfter(parseISO(e.date), today) || format(parseISO(e.date), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'))
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
    .slice(0, 3);

  return (
    <VecinoLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-8 text-primary-foreground shadow-lg">
          <h1 className="font-serif text-3xl font-bold md:text-4xl">
            ¡Bienvenido, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="mt-2 text-primary-foreground/90">
            Mantente al día con las actividades de tu comunidad
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-card transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Próximas Reuniones</CardTitle>
              <Calendar className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{upcomingMeetings.length}</div>
              <p className="text-sm text-muted-foreground">reuniones programadas</p>
            </CardContent>
          </Card>

          <Card className="shadow-card transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Eventos en Áreas Verdes</CardTitle>
              <TreePine className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{upcomingEvents.length}</div>
              <p className="text-sm text-muted-foreground">eventos próximos</p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Meetings */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-2xl font-semibold">Próximas Reuniones</h2>
            <Link to="/reuniones">
              <Button variant="ghost" className="gap-2">
                Ver todas <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          {upcomingMeetings.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingMeetings.map(meeting => (
                <Card key={meeting.id} className="shadow-card transition-all hover:shadow-lg hover:-translate-y-1">
                  <CardHeader>
                    <CardTitle className="text-lg">{meeting.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(parseISO(meeting.date), "d 'de' MMMM, yyyy", { locale: es })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {meeting.startTime} hrs
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {meeting.location}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="shadow-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No hay reuniones programadas</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Upcoming Events */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-2xl font-semibold">Eventos en Áreas Verdes</h2>
            <Link to="/eventos">
              <Button variant="ghost" className="gap-2">
                Ver todos <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          {upcomingEvents.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map(event => (
                <Card key={event.id} className="shadow-card transition-all hover:shadow-lg hover:-translate-y-1">
                  <CardHeader>
                    <div className="mb-2 inline-flex w-fit rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                      {event.greenArea}
                    </div>
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(parseISO(event.date), "d 'de' MMMM, yyyy", { locale: es })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {event.startTime} hrs
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="shadow-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TreePine className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No hay eventos programados</p>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </VecinoLayout>
  );
}
