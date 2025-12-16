import { useState, useEffect } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Transaction, PRESET_COLORS, DEFAULT_CATEGORIES } from '@/types/finance';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Palette, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransactionFormProps {
  editTransaction?: Transaction;
  onSuccess?: () => void;
}

export function TransactionForm({ editTransaction, onSuccess }: TransactionFormProps) {
  const { addTransaction, updateTransaction, getCategoryColor, getMostUsedColor } = useFinance();
  const { toast } = useToast();

  const [type, setType] = useState<'income' | 'expense'>(editTransaction?.type || 'income');
  const [category, setCategory] = useState(editTransaction?.category || '');
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState(editTransaction?.description || '');
  const [grossAmount, setGrossAmount] = useState(editTransaction?.grossAmount?.toString() || '');
  const [hasDeduction, setHasDeduction] = useState((editTransaction?.deductionPercentage || 0) > 0);
  const [deductionPercentage, setDeductionPercentage] = useState(
    editTransaction?.deductionPercentage?.toString() || '0'
  );
  const [selectedColor, setSelectedColor] = useState(editTransaction?.color || PRESET_COLORS[0]);
  const [date, setDate] = useState(editTransaction?.date || new Date().toISOString().split('T')[0]);
  const [colorWarning, setColorWarning] = useState<string | null>(null);

  // Calculate net amount
  const calculatedNet = parseFloat(grossAmount || '0') * (1 - parseFloat(deductionPercentage || '0') / 100);
  const deductionAmount = parseFloat(grossAmount || '0') * (parseFloat(deductionPercentage || '0') / 100);

  // Check for color consistency when category changes
  useEffect(() => {
    const finalCategory = category === 'custom' ? customCategory : category;
    if (finalCategory) {
      const historicalColor = getMostUsedColor(finalCategory);
      if (historicalColor && historicalColor !== selectedColor) {
        setColorWarning(`Usualmente usas ${historicalColor} para ${finalCategory}`);
      } else {
        setColorWarning(null);
      }
      // Pre-select historical color
      if (historicalColor && !editTransaction) {
        setSelectedColor(historicalColor);
        setColorWarning(null);
      }
    }
  }, [category, customCategory, getMostUsedColor, editTransaction]);

  // Update color warning when color changes
  useEffect(() => {
    const finalCategory = category === 'custom' ? customCategory : category;
    if (finalCategory) {
      const historicalColor = getMostUsedColor(finalCategory);
      if (historicalColor && historicalColor !== selectedColor) {
        setColorWarning(`Usualmente usas el color habitual para ${finalCategory}`);
      } else {
        setColorWarning(null);
      }
    }
  }, [selectedColor]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalCategory = category === 'custom' ? customCategory : category;

    if (!finalCategory || !grossAmount) {
      toast({
        title: 'Error',
        description: 'Por favor completa todos los campos requeridos',
        variant: 'destructive',
      });
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
    };

    if (editTransaction) {
      updateTransaction(editTransaction.id, transactionData);
      toast({
        title: '¡Actualizado!',
        description: 'La transacción ha sido actualizada correctamente',
      });
    } else {
      addTransaction(transactionData);
      toast({
        title: '¡Registrado!',
        description: `${type === 'income' ? 'Ingreso' : 'Gasto'} registrado correctamente`,
      });
      // Reset form
      setCategory('');
      setCustomCategory('');
      setDescription('');
      setGrossAmount('');
      setHasDeduction(false);
      setDeductionPercentage('0');
    }

    onSuccess?.();
  };

  const categories = type === 'income' ? DEFAULT_CATEGORIES.income : DEFAULT_CATEGORIES.expense;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Type Toggle */}
      <div className="flex p-1 bg-secondary/50 rounded-lg">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setType('income')}
          className={cn(
            'flex-1 rounded-md transition-all',
            type === 'income' && 'bg-income/20 text-income hover:bg-income/30'
          )}
        >
          Ingreso
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setType('expense')}
          className={cn(
            'flex-1 rounded-md transition-all',
            type === 'expense' && 'bg-expense/20 text-expense hover:bg-expense/30'
          )}
        >
          Gasto
        </Button>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label>Categoría</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-12 text-base input-glass">
            <SelectValue placeholder="Selecciona una categoría" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
            <SelectItem value="custom">+ Personalizada</SelectItem>
          </SelectContent>
        </Select>
        
        <AnimatePresence>
          {category === 'custom' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Input
                placeholder="Nombre de categoría personalizada"
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
                className="h-12 text-base input-glass mt-2"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label>Descripción (opcional)</Label>
        <Input
          placeholder="Ej: Pago de nómina, Uber Eats..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="h-12 text-base input-glass"
        />
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label>Monto Bruto</Label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            type="number"
            placeholder="0.00"
            value={grossAmount}
            onChange={e => setGrossAmount(e.target.value)}
            className="h-14 text-xl font-display pl-8 input-glass"
            step="0.01"
            min="0"
          />
        </div>
      </div>

      {/* Deduction Toggle */}
      {type === 'income' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50">
            <div className="flex items-center gap-3">
              <Calculator className="h-5 w-5 text-muted-foreground" />
              <Label className="cursor-pointer">¿Aplica deducción/impuesto?</Label>
            </div>
            <Switch checked={hasDeduction} onCheckedChange={setHasDeduction} />
          </div>

          <AnimatePresence>
            {hasDeduction && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>% Porcentaje de deducción</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0"
                      value={deductionPercentage}
                      onChange={e => setDeductionPercentage(e.target.value)}
                      className="h-12 text-base pr-8 input-glass"
                      step="0.1"
                      min="0"
                      max="100"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                  </div>
                </div>

                {/* Live Calculation Display */}
                {grossAmount && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 rounded-lg bg-primary/5 border border-primary/20"
                  >
                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ingreso Bruto:</span>
                        <span className="font-medium">${parseFloat(grossAmount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-expense">
                        <span>- Deducción ({deductionPercentage}%):</span>
                        <span className="font-medium">-${deductionAmount.toLocaleString()}</span>
                      </div>
                      <div className="h-px bg-border my-1" />
                      <div className="flex justify-between text-income font-display text-lg">
                        <span>= Líquido:</span>
                        <span className="font-bold">${calculatedNet.toLocaleString()}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Color Picker */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-muted-foreground" />
          <Label>Color de categoría</Label>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => setSelectedColor(color)}
              className={cn(
                'h-10 w-10 rounded-lg transition-all',
                selectedColor === color && 'ring-2 ring-offset-2 ring-offset-background ring-primary scale-110'
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        
        <AnimatePresence>
          {colorWarning && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20"
            >
              <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
              <span className="text-sm text-warning">{colorWarning}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label>Fecha</Label>
        <Input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="h-12 text-base input-glass"
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className={cn(
          'w-full h-14 text-lg font-display font-semibold btn-glow',
          type === 'income' ? 'bg-income hover:bg-income/90' : 'bg-expense hover:bg-expense/90'
        )}
      >
        {editTransaction ? 'Actualizar' : 'Registrar'} {type === 'income' ? 'Ingreso' : 'Gasto'}
      </Button>
    </form>
  );
}
