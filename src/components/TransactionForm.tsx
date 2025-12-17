import { useState, useEffect } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Transaction, PRESET_COLORS, Frequency } from '@/types/finance';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Palette, AlertTriangle, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransactionFormProps {
  editTransaction?: Transaction;
  onSuccess?: () => void;
}

export function TransactionForm({ editTransaction, onSuccess }: TransactionFormProps) {
  const { addTransaction, updateTransaction, getCategoryColor, getMostUsedColor, availableCategories } = useFinance();
  const { toast } = useToast();

  const [type, setType] = useState<'income' | 'expense'>(editTransaction?.type || 'income');
  const [category, setCategory] = useState(editTransaction?.category || '');
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState(editTransaction?.description || '');
  const [grossAmount, setGrossAmount] = useState(editTransaction?.grossAmount?.toString() || '');
  const [hasDeduction, setHasDeduction] = useState((editTransaction?.deductionPercentage || 0) > 0);
  const [deductionPercentage, setDeductionPercentage] = useState(editTransaction?.deductionPercentage?.toString() || '0');
  const [selectedColor, setSelectedColor] = useState(editTransaction?.color || PRESET_COLORS[0]);
  const [date, setDate] = useState(editTransaction?.date || new Date().toISOString().split('T')[0]);
  
  // NUEVO: Frecuencia y Recurrencia
  const [frequency, setFrequency] = useState<Frequency>(editTransaction?.frequency || 'one-time');
  const [isRecurring, setIsRecurring] = useState(false); // Checkbox para crear regla automática
  
  const [colorWarning, setColorWarning] = useState<string | null>(null);

  const calculatedNet = parseFloat(grossAmount || '0') * (1 - parseFloat(deductionPercentage || '0') / 100);
  const deductionAmount = parseFloat(grossAmount || '0') * (parseFloat(deductionPercentage || '0') / 100);

  // Manejo de categorías (Custom vs Lista)
  const currentCategories = type === 'income' ? availableCategories.income : availableCategories.expense;

  // Lógica de color inteligente (Mantenida igual)
  useEffect(() => {
    const finalCategory = category === 'custom' ? customCategory : category;
    if (finalCategory) {
      const historicalColor = getMostUsedColor(finalCategory);
      if (historicalColor && !editTransaction) setSelectedColor(historicalColor);
    }
  }, [category, customCategory, type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = category === 'custom' ? customCategory : category;

    if (!finalCategory || !grossAmount) {
      toast({ title: 'Error', description: 'Completa campos requeridos', variant: 'destructive' });
      return;
    }

    const transactionData = {
      type,
      category: finalCategory,
      description,
      grossAmount: parseFloat(grossAmount),
      deductionPercentage: hasDeduction ? parseFloat(deductionPercentage) : 0,
      netAmount: hasDeduction ? calculatedNet : parseFloat(grossAmount),
      color: selectedColor,
      date,
      frequency, // Guardamos la frecuencia
    };

    if (editTransaction) {
      updateTransaction(editTransaction.id, transactionData);
      toast({ title: 'Actualizado', description: 'Transacción guardada' });
    } else {
      // Pasamos 'isRecurring' para que el Context cree la regla si es necesario
      addTransaction(transactionData, isRecurring); 
      
      const msg = isRecurring 
        ? 'Se registró y se programó la recurrencia futura' 
        : 'Transacción registrada correctamente';
      
      toast({ title: '¡Listo!', description: msg });
      
      // Reset
      setCategory(''); setCustomCategory(''); setDescription(''); 
      setGrossAmount(''); setFrequency('one-time'); setIsRecurring(false);
    }
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Toggles Tipo */}
      <div className="flex p-1 bg-secondary/50 rounded-lg">
        <Button type="button" variant="ghost" onClick={() => setType('income')}
          className={cn('flex-1', type === 'income' && 'bg-income/20 text-income')}>Ingreso</Button>
        <Button type="button" variant="ghost" onClick={() => setType('expense')}
          className={cn('flex-1', type === 'expense' && 'bg-expense/20 text-expense')}>Gasto</Button>
      </div>

      {/* Categoría (Lista Dinámica) */}
      <div className="space-y-2">
        <Label>Categoría</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-12 input-glass"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
          <SelectContent>
            {currentCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            <SelectItem value="custom">+ Nueva Categoría</SelectItem>
          </SelectContent>
        </Select>
        {category === 'custom' && (
          <Input placeholder="Nombre de nueva categoría" value={customCategory} 
            onChange={e => setCustomCategory(e.target.value)} className="h-12 mt-2 input-glass" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Monto */}
        <div className="space-y-2">
          <Label>Monto</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input type="number" value={grossAmount} onChange={e => setGrossAmount(e.target.value)}
              className="h-12 pl-8 input-glass font-bold" />
          </div>
        </div>
        {/* Fecha */}
        <div className="space-y-2">
          <Label>Fecha</Label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-12 input-glass" />
        </div>
      </div>

      {/* NUEVO: Frecuencia y Recurrencia */}
      <div className="p-4 rounded-lg bg-secondary/30 space-y-4 border border-border/50">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Repeat className="h-4 w-4" /> Frecuencia del Movimiento
          </Label>
          <Select value={frequency} onValueChange={(v: Frequency) => setFrequency(v)}>
            <SelectTrigger className="h-10 bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="one-time">Único (Solo una vez)</SelectItem>
              <SelectItem value="daily">Diario</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="bi-weekly">Quincenal</SelectItem>
              <SelectItem value="monthly">Mensual (Ej: Sueldo/Alquiler)</SelectItem>
              <SelectItem value="yearly">Anual</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Ayuda a calcular tus metas. Ej: Si pones "Mensual", dividiremos el monto por 30 para tus metas diarias.
          </p>
        </div>

        {/* Checkbox Recurrencia (Solo si no es Único) */}
        {frequency !== 'one-time' && !editTransaction && (
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex flex-col">
              <span className="text-sm font-medium">¿Programar a futuro?</span>
              <span className="text-xs text-muted-foreground">Crear regla para que se repita automáticamente</span>
            </div>
            <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
          </div>
        )}
      </div>

      {/* Deducciones (Solo Ingresos) */}
      {type === 'income' && (
        <div className="space-y-2">
           <div className="flex items-center justify-between">
              <Label>¿Aplica Impuestos/Retención?</Label>
              <Switch checked={hasDeduction} onCheckedChange={setHasDeduction} />
           </div>
           {hasDeduction && (
             <div className="flex items-center gap-2">
                <Input type="number" value={deductionPercentage} onChange={e => setDeductionPercentage(e.target.value)}
                  className="w-20 input-glass" />
                <span className="text-sm">% ({deductionAmount.toLocaleString()}) = Neto: {calculatedNet.toLocaleString()}</span>
             </div>
           )}
        </div>
      )}

      {/* Color y submit (Simplificado para brevedad) */}
      <Button type="submit" className={cn('w-full h-12 text-lg', type === 'income' ? 'bg-income' : 'bg-expense')}>
        Guardar
      </Button>
    </form>
  );
}