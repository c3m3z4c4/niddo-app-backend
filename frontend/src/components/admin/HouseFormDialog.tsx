import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { House } from '@/types';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const houseSchema = z.object({
  houseNumber: z.string().min(1, 'El número de casa es requerido'),
  status: z.enum(['active', 'inactive']),
  type: z.enum(['terreno', 'en_construccion', 'casa']).optional(),
});

type HouseFormValues = z.infer<typeof houseSchema>;

interface HouseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  house: House | null;
  onSubmit: (data: Record<string, unknown>) => void;
}

export function HouseFormDialog({ open, onOpenChange, house, onSubmit }: HouseFormDialogProps) {
  const form = useForm<HouseFormValues>({
    resolver: zodResolver(houseSchema),
    defaultValues: {
      houseNumber: '',
      status: 'active',
      type: undefined,
    },
  });

  useEffect(() => {
    if (open) {
      if (house) {
        form.reset({
          houseNumber: house.houseNumber,
          status: house.status,
          type: house.type,
        });
      } else {
        form.reset({
          houseNumber: '',
          status: 'active',
          type: undefined,
        });
      }
    }
  }, [open, house, form]);

  const handleSubmit = (data: HouseFormValues) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {house ? 'Editar Casa' : 'Nueva Casa'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="houseNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Casa</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: A-101" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v || undefined)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sin especificar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Sin especificar</SelectItem>
                      <SelectItem value="casa">Casa</SelectItem>
                      <SelectItem value="terreno">Terreno</SelectItem>
                      <SelectItem value="en_construccion">En construcción</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Activa</SelectItem>
                      <SelectItem value="inactive">Inactiva</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {house ? 'Guardar Cambios' : 'Crear Casa'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
