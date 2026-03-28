import { House } from '@/types';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DeleteHouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  house: House | null;
  onConfirm: () => void;
}

export function DeleteHouseDialog({ open, onOpenChange, house, onConfirm }: DeleteHouseDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif">¿Eliminar casa?</AlertDialogTitle>
          <AlertDialogDescription>
            Estás a punto de eliminar la casa <strong>{house?.houseNumber}</strong>. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
