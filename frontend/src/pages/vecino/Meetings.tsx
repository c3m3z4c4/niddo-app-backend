import { VecinoLayout } from '@/components/layouts/VecinoLayout';
import { useMeetingsQuery } from '@/hooks/useApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin, FileText } from 'lucide-react';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RsvpButtons } from '@/components/RsvpButtons';

export default function VecinoMeetings() {
  const { data: meetings = [], isLoading } = useMeetingsQuery();

  const today = new Date();
  
  const upcomingMeetings = meetings
    .filter(m => isAfter(parseISO(m.date), today) || format(parseISO(m.date), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'))
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

  const pastMeetings = meetings
    .filter(m => isBefore(parseISO(m.date), today) && format(parseISO(m.date), 'yyyy-MM-dd') !== format(today, 'yyyy-MM-dd'))
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

  const MeetingCard = ({ meeting, isPast = false }: { meeting: typeof meetings[0]; isPast?: boolean }) => (
    <Card className={`shadow-card transition-all hover:shadow-lg ${isPast ? 'opacity-75' : 'hover:-translate-y-1'}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{meeting.title}</CardTitle>
            <CardDescription className="mt-1 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {format(parseISO(meeting.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </CardDescription>
          </div>
          {!isPast && (
            <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Próxima
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 text-primary" />
            <span>{meeting.startTime} hrs</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-accent" />
            <span>{meeting.location}</span>
          </div>
        </div>
        
        <div className="rounded-lg bg-muted/50 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <FileText className="h-4 w-4" />
            Descripción
          </div>
          <p className="text-sm text-muted-foreground">{meeting.description}</p>
        </div>

        {!isPast && (
          <div className="border-t pt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">¿Asistirás?</p>
            <RsvpButtons targetType="meeting" targetId={meeting.id} />
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <VecinoLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold">Reuniones Vecinales</h1>
          <p className="mt-1 text-muted-foreground">
            Consulta la agenda de reuniones de la comunidad
          </p>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="upcoming">
              Próximas ({upcomingMeetings.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Anteriores ({pastMeetings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            {upcomingMeetings.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {upcomingMeetings.map(meeting => (
                  <MeetingCard key={meeting.id} meeting={meeting} />
                ))}
              </div>
            ) : (
              <Card className="shadow-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-lg font-medium">No hay reuniones programadas</p>
                  <p className="text-muted-foreground">Las próximas reuniones aparecerán aquí</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-6">
            {pastMeetings.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {pastMeetings.map(meeting => (
                  <MeetingCard key={meeting.id} meeting={meeting} isPast />
                ))}
              </div>
            ) : (
              <Card className="shadow-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-lg font-medium">No hay reuniones anteriores</p>
                  <p className="text-muted-foreground">El historial de reuniones aparecerá aquí</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </VecinoLayout>
  );
}
