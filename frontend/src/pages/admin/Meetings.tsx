import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { TenantGuard } from '@/components/TenantGuard';
import { MeetingFormDialog } from '@/components/admin/MeetingFormDialog';
import { DeleteMeetingDialog } from '@/components/admin/DeleteMeetingDialog';
import { TablePagination, paginate } from '@/components/admin/TablePagination';
import { exportToCSV } from '@/lib/exportCSV';
import { useMeetingsQuery, useCreateMeeting, useUpdateMeeting, useDeleteMeeting } from '@/hooks/useApi';
import { Meeting } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Calendar, MapPin, Clock, Loader2, Search, Download } from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { RsvpCount } from '@/components/RsvpButtons';

export default function AdminMeetings() {
  const { data: meetings = [], isLoading } = useMeetingsQuery();
  const createMeeting = useCreateMeeting();
  const updateMeeting = useUpdateMeeting();
  const deleteMeeting = useDeleteMeeting();
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleCreate = () => { setSelectedMeeting(null); setFormOpen(true); };
  const handleEdit = (meeting: Meeting) => { setSelectedMeeting(meeting); setFormOpen(true); };
  const handleDelete = (meeting: Meeting) => { setSelectedMeeting(meeting); setDeleteOpen(true); };

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    try {
      if (selectedMeeting) {
        await updateMeeting.mutateAsync({ id: selectedMeeting.id, data });
        toast({ title: 'Reunión actualizada', description: `"${data.title}" se actualizó correctamente.` });
      } else {
        await createMeeting.mutateAsync(data as Parameters<typeof createMeeting.mutateAsync>[0]);
        toast({ title: 'Reunión creada', description: `"${data.title}" se creó correctamente.` });
      }
      setFormOpen(false);
    } catch {
      toast({ title: 'Error', description: 'No se pudo guardar la reunión.', variant: 'destructive' });
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedMeeting) {
      try {
        await deleteMeeting.mutateAsync(selectedMeeting.id);
        toast({ title: 'Reunión eliminada', description: `"${selectedMeeting.title}" fue eliminada.`, variant: 'destructive' });
        setDeleteOpen(false);
        setSelectedMeeting(null);
      } catch {
        toast({ title: 'Error', description: 'No se pudo eliminar la reunión.', variant: 'destructive' });
      }
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...meetings]
      .filter(m => {
        if (q && !m.title.toLowerCase().includes(q) && !m.location.toLowerCase().includes(q)) return false;
        if (statusFilter === 'upcoming' && isPast(parseISO(m.date))) return false;
        if (statusFilter === 'past' && !isPast(parseISO(m.date))) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [meetings, search, statusFilter]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <TenantGuard>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold">Gestión de Reuniones</h1>
            <p className="text-muted-foreground">
              {meetings.length} {meetings.length === 1 ? 'reunión registrada' : 'reuniones registradas'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => exportToCSV(filtered, [
              { key: 'title', header: 'Título' }, { key: 'date', header: 'Fecha' },
              { key: 'startTime', header: 'Hora' }, { key: 'location', header: 'Ubicación' },
              { key: 'description', header: 'Descripción' },
            ], 'reuniones')} disabled={filtered.length === 0}>
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Nueva Reunión
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por título o ubicación..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="upcoming">Próximas</SelectItem>
              <SelectItem value="past">Pasadas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="shadow-card">
          <CardContent className="p-0">
            {meetings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Calendar className="h-12 w-12 text-muted-foreground/40" />
                <p className="mt-4 text-lg font-medium">No hay reuniones</p>
                <p className="text-sm text-muted-foreground">Crea tu primera reunión vecinal</p>
                <Button onClick={handleCreate} className="mt-4 gap-2" variant="outline">
                  <Plus className="h-4 w-4" /> Crear reunión
                </Button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Search className="h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 text-sm text-muted-foreground">No se encontraron resultados</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Hora</TableHead>
                        <TableHead className="hidden md:table-cell">Ubicación</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>RSVP</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginate(filtered, page, pageSize).map((meeting) => {
                        const meetingDate = parseISO(meeting.date);
                        const past = isPast(meetingDate);
                        return (
                          <TableRow key={meeting.id}>
                            <TableCell className="font-medium max-w-[200px] truncate">{meeting.title}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                {format(meetingDate, 'dd MMM yyyy', { locale: es })}
                              </span>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <span className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                {meeting.startTime}
                              </span>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <span className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                {meeting.location}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={past ? 'secondary' : 'default'}>{past ? 'Pasada' : 'Próxima'}</Badge>
                            </TableCell>
                            <TableCell>
                              <RsvpCount targetType="meeting" targetId={meeting.id} />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(meeting)} title="Editar">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(meeting)} title="Eliminar" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <TablePagination totalItems={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <MeetingFormDialog key={selectedMeeting?.id ?? 'new'} open={formOpen} onOpenChange={setFormOpen} meeting={selectedMeeting} onSubmit={handleFormSubmit} />
      <DeleteMeetingDialog open={deleteOpen} onOpenChange={setDeleteOpen} meeting={selectedMeeting} onConfirm={handleConfirmDelete} />
      </TenantGuard>
    </AdminLayout>
  );
}
