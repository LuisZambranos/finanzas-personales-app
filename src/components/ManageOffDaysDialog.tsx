// src/components/ManageOffDaysDialog.tsx
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Goal } from '@/types/finance';
import { useFinance } from '@/contexts/FinanceContext';
import { parseLocalDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ManageOffDaysDialogProps {
  goal: Goal | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ManageOffDaysDialog({ goal, isOpen, onClose }: ManageOffDaysDialogProps) {
  const { updateGoal } = useFinance();
  const { toast } = useToast();
  const [tempOffDays, setTempOffDays] = useState<Date[]>([]);

  // Cada vez que se abre el modal o cambia la meta, cargamos sus días libres
  useEffect(() => {
    if (goal && isOpen) {
      setTempOffDays((goal.offDays || []).map(d => parseLocalDate(d)));
    } else {
      setTempOffDays([]); // Limpiamos al cerrar
    }
  }, [goal, isOpen]);

  const handleSave = async () => {
    if (!goal) return;
    
    // Formatear las fechas a YYYY-MM-DD sin duplicados
    const uniqueDates = Array.from(new Set(
      tempOffDays.map(d => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      })
    )).sort();

    await updateGoal(goal.id, { offDays: uniqueDates });
    
    toast({ title: 'Días libres actualizados', description: `Se excluirán ${uniqueDates.length} días.` });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass-card max-w-md max-h-[85vh] overflow-y-auto border-border/50">
        <DialogHeader>
          <DialogTitle>Gestionar Días Libres</DialogTitle>
          <DialogDescription>Selecciona los días que NO trabajaste en la meta "{goal?.name}".</DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center p-4 theme-orange">
          <CalendarComponent
            mode="multiple"
            selected={tempOffDays}
            onSelect={setTempOffDays as any}
            className="rounded-md border border-border/50 bg-transparent text-foreground"
            classNames={{
              cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20"
            }}
          />
        </div>
        
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}