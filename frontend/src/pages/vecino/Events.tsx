import { VecinoLayout } from '@/components/layouts/VecinoLayout';
import { useEventsQuery } from '@/hooks/useApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, TreePine, FileText } from 'lucide-react';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RsvpButtons } from '@/components/RsvpButtons';

export default function VecinoEvents() {
  const { data: events = [], isLoading } = useEventsQuery();

  const today = new Date();
  
  const upcomingEvents = events
    .filter(e => isAfter(parseISO(e.date), today) || format(parseISO(e.date), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'))
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

  const pastEvents = events
    .filter(e => isBefore(parseISO(e.date), today) && format(parseISO(e.date), 'yyyy-MM-dd') !== format(today, 'yyyy-MM-dd'))
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

  if (isLoading) {
    return (
      <VecinoLayout>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </VecinoLayout>
    );
  }

  const EventCard = ({ event, isPast = false }: { event: typeof events[0]; isPast?: boolean }) => (
    <Card className={`shadow-card transition-all hover:shadow-lg ${isPast ? 'opacity-75' : 'hover:-translate-y-1'}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-2 inline-flex rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <TreePine className="mr-1 h-3 w-3" />
              {event.greenArea}
            </div>
            <CardTitle className="text-xl">{event.title}</CardTitle>
            <CardDescription className="mt-1 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {format(parseISO(event.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 text-primary" />
          <span>{event.startTime} hrs</span>
        </div>
        
        <div className="rounded-lg bg-muted/50 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <FileText className="h-4 w-4" />
            Descripción
          </div>
          <p className="text-sm text-muted-foreground">{event.description}</p>
        </div>

        {!isPast && (
          <div className="border-t pt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">¿Asistirás?</p>
            <RsvpButtons targetType="event" targetId={event.id} />
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <VecinoLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold">Eventos en Áreas Verdes</h1>
          <p className="mt-1 text-muted-foreground">
            Descubre las actividades programadas en nuestras áreas verdes
          </p>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="upcoming">
              Próximos ({upcomingEvents.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Anteriores ({pastEvents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            {upcomingEvents.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {upcomingEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <Card className="shadow-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <TreePine className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-lg font-medium">No hay eventos programados</p>
                  <p className="text-muted-foreground">Los próximos eventos aparecerán aquí</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-6">
            {pastEvents.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {pastEvents.map(event => (
                  <EventCard key={event.id} event={event} isPast />
                ))}
              </div>
            ) : (
              <Card className="shadow-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <TreePine className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-lg font-medium">No hay eventos anteriores</p>
                  <p className="text-muted-foreground">El historial de eventos aparecerá aquí</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </VecinoLayout>
  );
}
