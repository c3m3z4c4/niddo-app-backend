import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { UserFormDialog } from '@/components/admin/UserFormDialog';
import { DeleteUserDialog } from '@/components/admin/DeleteUserDialog';
import { TablePagination, paginate } from '@/components/admin/TablePagination';
import { exportToCSV } from '@/lib/exportCSV';
import { useUsersQuery, useCreateUser, useUpdateUser, useDeleteUser, useHousesQuery } from '@/hooks/useApi';
import { User } from '@/types';
import { ADMIN_ROLES } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Users as UsersIcon, Loader2, Shield, Home, Search, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminUsers() {
  const { data: users = [], isLoading } = useUsersQuery();
  const { data: houses = [] } = useHousesQuery();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'RESIDENT' | 'CONDO_ADMIN'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleCreate = () => { setSelectedUser(null); setFormOpen(true); };
  const handleEdit = (u: User) => { setSelectedUser(u); setFormOpen(true); };
  const handleDelete = (u: User) => { setSelectedUser(u); setDeleteOpen(true); };

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    try {
      if (selectedUser) {
        await updateUser.mutateAsync({ id: selectedUser.id, data });
        toast({ title: 'Usuario actualizado', description: `"${data.name}" se actualizó correctamente.` });
      } else {
        await createUser.mutateAsync(data as Parameters<typeof createUser.mutateAsync>[0]);
        toast({ title: 'Usuario creado', description: `"${data.name}" se creó correctamente.` });
      }
      setFormOpen(false);
    } catch {
      toast({ title: 'Error', description: 'No se pudo guardar el usuario.', variant: 'destructive' });
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedUser) {
      try {
        await deleteUser.mutateAsync(selectedUser.id);
        toast({ title: 'Usuario eliminado', description: `"${selectedUser.name}" fue eliminado.`, variant: 'destructive' });
        setDeleteOpen(false);
        setSelectedUser(null);
      } catch {
        toast({ title: 'Error', description: 'No se pudo eliminar el usuario.', variant: 'destructive' });
      }
    }
  };

  const getHouseNumber = (houseId?: string | null) => {
    if (!houseId) return '—';
    return houses.find(h => h.id === houseId)?.houseNumber || '—';
  };

  const isAdmin = (u: User) => ADMIN_ROLES.includes(u.role);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => {
      const fullName = `${u.name} ${u.lastName}`.toLowerCase();
      if (q && !fullName.includes(q) && !u.email.toLowerCase().includes(q)) return false;
      if (roleFilter === 'RESIDENT' && u.role !== 'RESIDENT') return false;
      if (roleFilter === 'CONDO_ADMIN' && !isAdmin(u)) return false;
      return true;
    });
  }, [users, search, roleFilter]);

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
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">
              {users.length} {users.length === 1 ? 'usuario registrado' : 'usuarios registrados'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => exportToCSV(filtered, [
              { key: 'name', header: 'Nombre' }, { key: 'lastName', header: 'Apellido' },
              { key: 'email', header: 'Email' }, { key: 'role', header: 'Rol' },
            ], 'usuarios')} disabled={filtered.length === 0}>
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Nuevo Usuario
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por nombre o email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              <SelectItem value="CONDO_ADMIN">Admin</SelectItem>
              <SelectItem value="RESIDENT">Vecino</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="shadow-card">
          <CardContent className="p-0">
            {users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <UsersIcon className="h-12 w-12 text-muted-foreground/40" />
                <p className="mt-4 text-lg font-medium">No hay usuarios</p>
                <p className="text-sm text-muted-foreground">Registra el primer usuario</p>
                <Button onClick={handleCreate} className="mt-4 gap-2" variant="outline">
                  <Plus className="h-4 w-4" /> Crear usuario
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
                        <TableHead>Nombre</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead className="hidden md:table-cell">Casa</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginate(filtered, page, pageSize).map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.name} {u.lastName}</TableCell>
                          <TableCell className="text-muted-foreground">{u.email}</TableCell>
                          <TableCell>
                            <Badge variant={isAdmin(u) ? 'default' : 'secondary'} className="gap-1">
                              {isAdmin(u) ? <Shield className="h-3 w-3" /> : <Home className="h-3 w-3" />}
                              {isAdmin(u) ? 'Admin' : 'Vecino'}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{getHouseNumber(u.houseId)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(u)} title="Editar">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(u)} title="Eliminar" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <TablePagination totalItems={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <UserFormDialog key={selectedUser?.id ?? 'new'} open={formOpen} onOpenChange={setFormOpen} user={selectedUser} onSubmit={handleFormSubmit} houses={houses} />
      <DeleteUserDialog open={deleteOpen} onOpenChange={setDeleteOpen} user={selectedUser} onConfirm={handleConfirmDelete} />
    </AdminLayout>
  );
}
