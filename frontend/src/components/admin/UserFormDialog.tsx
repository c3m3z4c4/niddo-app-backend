import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const userSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(200),
  lastName: z.string().trim().min(1, 'El apellido es obligatorio').max(200),
  email: z.string().trim().email('Email inválido').max(255),
  password: z.string().min(6, 'Mínimo 6 caracteres').optional().or(z.literal('')),
  role: z.enum(['RESIDENT', 'CONDO_ADMIN', 'PRESIDENTE', 'SECRETARIO', 'TESORERO'], { required_error: 'Selecciona un rol' }),
  houseId: z.string().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSubmit: (data: Record<string, unknown>) => void;
  houses: { id: string; houseNumber: string }[];
}

export function UserFormDialog({ open, onOpenChange, user, onSubmit, houses }: UserFormDialogProps) {
  const isEditing = !!user;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: user
      ? {
          name: user.name,
          lastName: user.lastName,
          email: user.email,
          password: '',
          role: (user.role === 'PLATFORM_ADMIN' ? 'CONDO_ADMIN' : user.role) as UserFormValues['role'],
          houseId: user.houseId || '',
        }
      : { name: '', lastName: '', email: '', password: '', role: 'RESIDENT', houseId: '' },
  });

  const role = form.watch('role');

  const handleSubmit = (values: UserFormValues) => {
    const payload: Record<string, unknown> = {
      name: values.name,
      lastName: values.lastName,
      email: values.email,
      role: values.role,
      houseId: values.role === 'RESIDENT' ? values.houseId || undefined : undefined,
    };
    if (values.password) {
      payload.password = values.password;
    }
    onSubmit(payload);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modifica los datos del usuario.' : 'Completa los datos para registrar un nuevo usuario.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Juan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo electrónico</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="correo@ejemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isEditing ? 'Nueva contraseña (opcional)' : 'Contraseña'}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="RESIDENT">Vecino</SelectItem>
                      <SelectItem value="CONDO_ADMIN">Administrador</SelectItem>
                      <SelectItem value="PRESIDENTE">Presidente</SelectItem>
                      <SelectItem value="SECRETARIO">Secretario</SelectItem>
                      <SelectItem value="TESORERO">Tesorero</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {role === 'RESIDENT' && (
              <FormField
                control={form.control}
                name="houseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Casa asignada</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sin asignar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Sin asignar</SelectItem>
                        {houses.map((h) => (
                          <SelectItem key={h.id} value={h.id}>{h.houseNumber}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
