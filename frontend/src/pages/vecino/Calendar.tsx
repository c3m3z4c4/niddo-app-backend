import { useState, useMemo } from 'react';
import { VecinoLayout } from '@/components/layouts/VecinoLayout';
import { useMeetingsQuery, useEventsQuery } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, TreePine, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, parseISO, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Meeting, GreenAreaEvent } from '@/types';
import { RsvpButtons } from '@/components/RsvpButtons';

type CalendarItem = 
  | { type: 'meeting'; data: Meeting }
  | { type: 'event'; data: GreenAreaEvent };

export default function VecinoCalendar() {
  const { data: meetings = [] } = useMeetingsQuery();
  const { data: events = [] } = useEventsQuery();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // Build a map of date -> items
  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    meetings.forEach(m => {
      const key = m.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ type: 'meeting', data: m });
    });
    events.forEach(e => {
      const key = e.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ type: 'event', data: e });
    });
    return map;
  }, [meetings, events]);

  // Calendar grid days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const selectedItems = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, 'yyyy-MM-dd');
    return itemsByDate.get(key) || [];
  }, [selectedDate, itemsByDate]);

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <VecinoLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Calendario</h1>
          <p className="mt-1 text-muted-foreground">Vista mensual de reuniones y eventos</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar Grid */}
          <Card className="shadow-card lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <CardTitle className="font-serif text-xl capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: es })}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Week day headers */}
              <div className="grid grid-cols-7 mb-1">
                {weekDays.map(day => (
                  <div key={day} className="py-2 text-center text-xs font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7">
                {calendarDays.map(day => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const items = itemsByDate.get(dateKey) || [];
                  const hasMeetings = items.some(i => i.type === 'meeting');
                  const hasEvents = items.some(i => i.type === 'event');
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const today = isToday(day);

                  return (
                    <button
                      key={dateKey}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "relative flex flex-col items-center gap-0.5 rounded-lg p-1.5 transition-colors min-h-[3.5rem] md:min-h-[4rem]",
                        isCurrentMonth ? "text-foreground" : "text-muted-foreground/40",
                        isSelected && "bg-primary/10 ring-2 ring-primary",
                        !isSelected && "hover:bg-muted",
                        today && !isSelected && "bg-accent/20"
                      )}
                    >
                      <span className={cn(
                        "text-sm font-medium",
                        today && "text-primary font-bold"
                      )}>
                        {format(day, 'd')}
                      </span>
                      {items.length > 0 && (
                        <div className="flex gap-0.5">
                          {hasMeetings && (
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          )}
                          {hasEvents && (
                            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 flex items-center gap-4 border-t pt-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  Reuniones
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                  Eventos
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Day Detail */}
          <div className="space-y-4">
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {selectedDate
                    ? format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })
                    : 'Selecciona un día'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedItems.length === 0 ? (
                  <div className="flex flex-col items-center py-6 text-muted-foreground">
                    <CalendarIcon className="mb-2 h-8 w-8 opacity-40" />
                    <p className="text-sm">Sin actividades este día</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedItems.map(item => (
                      <div
                        key={`${item.type}-${item.data.id}`}
                        className={cn(
                          "rounded-lg border p-3 transition-colors",
                          item.type === 'meeting' ? "border-primary/20 bg-primary/5" : "border-accent/20 bg-accent/5"
                        )}
                      >
                        <div className="mb-1.5 flex items-center gap-2">
                          <Badge variant={item.type === 'meeting' ? 'default' : 'secondary'} className="text-[10px]">
                            {item.type === 'meeting' ? '📅 Reunión' : '🌳 Evento'}
                          </Badge>
                        </div>
                        <h4 className="font-medium text-sm">{item.data.title}</h4>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {item.data.startTime} hrs
                          </div>
                          {item.type === 'meeting' && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {(item.data as Meeting).location}
                            </div>
                          )}
                          {item.type === 'event' && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <TreePine className="h-3 w-3" />
                              {(item.data as GreenAreaEvent).greenArea}
                            </div>
                          )}
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                          {item.data.description}
                        </p>
                        <div className="mt-3 border-t pt-2">
                          <RsvpButtons targetType={item.type} targetId={item.data.id} compact />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </VecinoLayout>
  );
}
