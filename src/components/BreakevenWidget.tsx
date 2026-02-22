// src/components/BreakevenWidget.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFixedExpenses } from '@/hooks/useFixedExpenses';
import { useFinance } from '@/contexts/FinanceContext';
import { parseLocalDate, cn } from '@/lib/utils';
import { Scale, Plus, Trash2, TrendingUp, AlertTriangle, Settings2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export function BreakevenWidget() {
  const { fixedExpenses, addFixedExpense, removeFixedExpense, totalFixedExpenses, workingDays, setWorkingDays } = useFixedExpenses();
  const { transactions } = useFinance();
  const [isManageOpen, setIsManageOpen] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');

  const calculateCurrentMonthDailyAverage = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const currentMonthIncomes = transactions.filter(t => {
      if (t.type !== 'income') return false;
      const tDate = parseLocalDate(t.date);
      return tDate >= startOfMonth && tDate <= today;
    });

    const totalIncomeThisMonth = currentMonthIncomes.reduce((sum, t) => sum + t.netAmount, 0);
    const daysPassed = today.getDate(); 
    
    return totalIncomeThisMonth / daysPassed;
  };

  const currentDailyAverage = calculateCurrentMonthDailyAverage();
  
  // AHORA DIVIDE EXACTAMENTE POR TUS DÍAS DE TRABAJO
  const targetDailyAverage = workingDays > 0 ? totalFixedExpenses / workingDays : 0;
  
  const isSurviving = currentDailyAverage >= targetDailyAverage;
  const deficit = Math.max(0, targetDailyAverage - currentDailyAverage);

  const handleAdd = () => {
    if (!newName.trim() || !newAmount || Number(newAmount) <= 0) return;
    addFixedExpense(newName, parseFloat(newAmount));
    setNewName('');
    setNewAmount('');
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 relative overflow-hidden group">
        <div className="flex items-start justify-between relative z-10 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Scale className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold">Punto de Equilibrio</h3>
              <p className="text-xs text-muted-foreground">Tu minimo para no endeudarte</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsManageOpen(true)} className="text-muted-foreground hover:text-primary">
            <Settings2 className="h-5 w-5" />
          </Button>
        </div>

        {totalFixedExpenses === 0 ? (
          <div className="text-center py-4 relative z-10">
            <p className="text-sm text-muted-foreground mb-3">No has ingresado tus gastos fijos.</p>
            <Button variant="outline" size="sm" onClick={() => setIsManageOpen(true)}>Configurar Presupuesto</Button>
          </div>
        ) : (
          <div className="space-y-5 relative z-10">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary/30 p-3 rounded-xl border border-border/50">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Gastos Fijos ({workingDays} días)</p>
                <p className="font-display font-bold text-lg text-expense">${totalFixedExpenses.toLocaleString()}</p>
              </div>
              <div className="bg-secondary/30 p-3 rounded-xl border border-border/50">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Meta Diaria (Min)</p>
                <p className="font-display font-bold text-lg text-primary">${Math.trunc(targetDailyAverage).toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end mb-1">
                <span className="text-sm font-medium">Tu Promedio Actual:</span>
                <span className={cn("font-bold", isSurviving ? "text-income" : "text-warning")}>
                  ${Math.trunc(currentDailyAverage).toLocaleString()}/día
                </span>
              </div>
              
              <div className="h-3 rounded-full bg-secondary overflow-hidden">
                 <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${Math.min((currentDailyAverage / targetDailyAverage) * 100, 100)}%` }} 
                    className={cn('h-full rounded-full transition-all duration-1000', isSurviving ? 'bg-income' : 'bg-warning')} 
                 />
              </div>
            </div>

            {isSurviving ? (
               <div className="p-3 rounded-lg bg-income/10 border border-income/20 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-income" />
                  <span className="text-sm text-income font-medium">¡Excelente! Estás cubriendo tus gastos vitales.</span>
               </div>
            ) : (
               <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                  <div className="text-sm">
                    <p className="text-warning font-medium">Te faltan ${Math.trunc(deficit).toLocaleString()} diarios</p>
                    <p className="text-muted-foreground text-[10px] mt-0.5">Para alcanzar tu punto de equilibrio este mes.</p>
                  </div>
               </div>
            )}
          </div>
        )}
        <div className={cn("absolute -right-4 -bottom-4 h-32 w-32 rounded-full opacity-5 blur-2xl z-0 pointer-events-none", isSurviving ? "bg-income" : "bg-warning")} />
      </motion.div>

      {/* MODAL PARA GESTIONAR LA LISTA */}
      <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
        <DialogContent className="glass-card max-w-md max-h-[85vh] overflow-y-auto border-border/50">
          <DialogHeader>
            <DialogTitle>Gastos Fijos Vitales</DialogTitle>
            <DialogDescription>Ingresa tus gastos obligatorios del mes y los días que trabajarás.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            
            {/* NUEVO INPUT PARA DÍAS HÁBILES GLOBALES */}
            <div className="bg-secondary/30 p-3 rounded-lg border border-border/50 mb-4">
               <Label className="text-xs mb-1 block">¿Cuántos días al mes planeas trabajar?</Label>
               <div className="flex items-center gap-3">
                 <Input 
                   type="number" 
                   value={workingDays} 
                   onChange={e => setWorkingDays(Number(e.target.value) || 1)} 
                   className="input-glass w-24 h-9" 
                   min="1" max="31"
                 />
                 <span className="text-xs text-muted-foreground">
                   (Tus gastos se dividirán en {workingDays} días)
                 </span>
               </div>
            </div>

            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs">Nombre (Ej: Universidad)</Label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} className="input-glass h-9" />
              </div>
              <div className="w-32 space-y-1.5">
                <Label className="text-xs">Monto Mensual</Label>
                <Input type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} className="input-glass h-9" />
              </div>
              <Button onClick={handleAdd} size="icon" className="h-9 w-9 bg-primary hover:bg-primary/90 shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="rounded-md border border-border/50 divide-y divide-border/50 mt-4 max-h-48 overflow-y-auto">
              <AnimatePresence>
                {fixedExpenses.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">La lista está vacía.</div>
                ) : (
                  fixedExpenses.map(expense => (
                    <motion.div key={expense.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-between p-3 hover:bg-secondary/20 transition-colors"
                    >
                      <span className="font-medium text-sm">{expense.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-expense font-semibold text-sm">${expense.amount.toLocaleString()}</span>
                        <Button variant="ghost" size="icon" onClick={() => removeFixedExpense(expense.id)} className="h-6 w-6 text-muted-foreground hover:text-expense">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
            
            <div className="flex justify-between items-center bg-secondary/30 p-3 rounded-lg border border-border/50">
               <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Total Mensual</span>
               <span className="font-display font-bold text-lg text-expense">${totalFixedExpenses.toLocaleString()}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}