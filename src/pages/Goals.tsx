// src/pages/Goals.tsx
import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Trash2, TrendingUp, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Goal } from '@/types/finance';

export default function Goals() {
  // Traemos 'calculateAmortizedAmount' del contexto
  const { goals, addGoal, deleteGoal, transactions, calculateAmortizedAmount } = useFinance();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Estado del formulario (Ahora con fechas)
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    period: 'daily' as Goal['period'],
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });

  // --- CÁLCULO INTELIGENTE DE PROGRESO POR META ---
  const getGoalProgressData = (goal: Goal) => {
    // 1. Definir rango de fechas válido
    const start = new Date(goal.startDate);
    const end = goal.endDate ? new Date(goal.endDate) : new Date(); // Si no hay fin, hasta hoy
    
    // 2. Filtrar transacciones dentro del rango y que sean Ingresos (asumiendo metas de ahorro/ingreso)
    // OJO: Si quieres metas de "No gastar más de X", habría que filtrar 'expense'. 
    // Por defecto asumo metas de recaudación (Income).
    const relevantTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return t.type === 'income' && tDate >= start && (goal.endDate ? tDate <= end : true);
    });

    // 3. Sumar usando la amortización (La magia matemática)
    const currentAmount = relevantTransactions.reduce((sum, t) => {
      return sum + calculateAmortizedAmount(t.netAmount, t.frequency, goal.period);
    }, 0);

    const targetWithDeficit = goal.targetAmount + (goal.accumulatedDeficit || 0);
    const progress = targetWithDeficit > 0 ? (currentAmount / targetWithDeficit) * 100 : 0;
    const deficit = Math.max(0, targetWithDeficit - currentAmount);

    return { currentAmount, progress, deficit, isOnTrack: currentAmount >= targetWithDeficit };
  };

  const handleAddGoal = () => {
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.startDate) {
      toast({
        title: 'Error',
        description: 'Completa nombre, monto y fecha de inicio',
        variant: 'destructive',
      });
      return;
    }

    addGoal({
      name: newGoal.name,
      targetAmount: parseFloat(newGoal.targetAmount),
      currentAmount: 0, // Se calcula dinámicamente, pero guardamos 0 inicial
      period: newGoal.period,
      startDate: newGoal.startDate,
      endDate: newGoal.endDate || undefined,
      accumulatedDeficit: 0,
    });

    toast({
      title: '¡Meta creada!',
      description: 'Tu nueva meta ha sido registrada',
    });

    setNewGoal({ 
        name: '', targetAmount: '', period: 'daily', 
        startDate: new Date().toISOString().split('T')[0], endDate: '' 
    });
    setIsDialogOpen(false);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-display text-2xl md:text-3xl font-bold">
              <span className="text-gradient">Metas Financieras</span>
            </h1>
            <p className="text-muted-foreground">Define objetivos y rastrea tu progreso automáticamente.</p>
          </motion.div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 btn-glow gap-2">
                <Plus className="h-4 w-4" />
                Nueva Meta
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-border/50 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display">Crear Nueva Meta</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    placeholder="Ej: Ahorro para vacaciones, Meta de ventas..."
                    value={newGoal.name}
                    onChange={e => setNewGoal({ ...newGoal, name: e.target.value })}
                    className="h-12 input-glass"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Monto Objetivo</Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          type="number"
                          placeholder="0"
                          value={newGoal.targetAmount}
                          onChange={e => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                          className="h-12 pl-8 input-glass"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Período</Label>
                      <Select
                        value={newGoal.period}
                        onValueChange={(v: Goal['period']) => setNewGoal({ ...newGoal, period: v })}
                      >
                        <SelectTrigger className="h-12 input-glass">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Diario</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensual</SelectItem>
                          <SelectItem value="yearly">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Fecha Inicio</Label>
                        <Input type="date" value={newGoal.startDate} 
                            onChange={e => setNewGoal({...newGoal, startDate: e.target.value})}
                            className="input-glass" 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Fecha Fin (Opcional)</Label>
                        <Input type="date" value={newGoal.endDate} 
                            onChange={e => setNewGoal({...newGoal, endDate: e.target.value})}
                            className="input-glass" 
                        />
                    </div>
                </div>

                <Button onClick={handleAddGoal} className="w-full h-12 bg-primary hover:bg-primary/90 mt-2">
                  Guardar Meta
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Goals List */}
        <AnimatePresence>
          {goals.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-8 text-center"
            >
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">Sin metas activas</h3>
              <p className="text-muted-foreground mb-4">
                Crea tu primera meta para comenzar a rastrear tu progreso
              </p>
            </motion.div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {goals.map((goal, index) => {
                // Calculamos datos en tiempo real
                const { currentAmount, progress, deficit, isOnTrack } = getGoalProgressData(goal);
                const targetWithDeficit = goal.targetAmount + (goal.accumulatedDeficit || 0);

                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-card p-5 relative overflow-hidden group"
                  >
                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Target className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-display font-semibold">{goal.name}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="capitalize">{goal.period}</span>
                            <span>•</span>
                            <Calendar className="h-3 w-3" />
                            <span>Desde {new Date(goal.startDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOnTrack ? (
                          <CheckCircle className="h-5 w-5 text-income" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-warning" />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteGoal(goal.id)}
                          className="h-9 w-9 text-muted-foreground hover:text-expense opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2 mb-4 relative z-10">
                      <div className="h-3 rounded-full bg-secondary overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(progress, 100)}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className={cn(
                            'h-full rounded-full transition-colors',
                            isOnTrack ? 'bg-income' : progress >= 80 ? 'bg-warning' : 'bg-expense'
                          )}
                        />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          ${currentAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} / ${targetWithDeficit.toLocaleString()}
                        </span>
                        <span className={cn('font-medium', isOnTrack ? 'text-income' : 'text-warning')}>
                          {Math.min(progress, 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Deficit Warning */}
                    {!isOnTrack && deficit > 0 && (
                      <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 mb-2 relative z-10">
                        <div className="flex items-start gap-2">
                          <TrendingUp className="h-4 w-4 text-warning mt-0.5" />
                          <div className="text-sm">
                            <p className="text-warning font-medium">
                              Faltan: ${deficit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Fondo decorativo sutil */}
                    <div className={cn(
                        "absolute -right-4 -bottom-4 h-32 w-32 rounded-full opacity-5 blur-2xl z-0",
                        isOnTrack ? "bg-income" : "bg-warning"
                    )} />
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}