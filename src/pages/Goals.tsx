import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Trash2, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Goal } from '@/types/finance';

export default function Goals() {
  const { goals, addGoal, updateGoal, deleteGoal, transactions } = useFinance();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    period: 'daily' as Goal['period'],
  });

  // Calculate today's progress for daily goals
  const today = new Date().toISOString().split('T')[0];
  const todayIncome = transactions
    .filter(t => t.date === today && t.type === 'income')
    .reduce((sum, t) => sum + t.netAmount, 0);

  const handleAddGoal = () => {
    if (!newGoal.name || !newGoal.targetAmount) {
      toast({
        title: 'Error',
        description: 'Completa todos los campos',
        variant: 'destructive',
      });
      return;
    }

    addGoal({
      name: newGoal.name,
      targetAmount: parseFloat(newGoal.targetAmount),
      currentAmount: 0,
      period: newGoal.period,
      startDate: new Date().toISOString().split('T')[0],
      accumulatedDeficit: 0,
    });

    toast({
      title: '¡Meta creada!',
      description: 'Tu nueva meta ha sido registrada',
    });

    setNewGoal({ name: '', targetAmount: '', period: 'daily' });
    setIsDialogOpen(false);
  };

  const handleEndDay = (goal: Goal) => {
    const targetWithDeficit = goal.targetAmount + goal.accumulatedDeficit;
    const deficit = Math.max(0, targetWithDeficit - todayIncome);

    updateGoal(goal.id, {
      accumulatedDeficit: deficit,
      currentAmount: todayIncome,
    });

    if (deficit > 0) {
      toast({
        title: 'Día cerrado',
        description: `Déficit de $${deficit.toLocaleString()} agregado a mañana`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: '¡Excelente!',
        description: 'Cumpliste tu meta del día',
      });
    }
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
              <span className="text-gradient">Metas Dinámicas</span>
            </h1>
            <p className="text-muted-foreground">Objetivos con lógica acumulativa</p>
          </motion.div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 btn-glow gap-2">
                <Plus className="h-4 w-4" />
                Nueva Meta
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-border/50">
              <DialogHeader>
                <DialogTitle className="font-display">Crear Nueva Meta</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Nombre de la meta</Label>
                  <Input
                    placeholder="Ej: Meta diaria de ventas"
                    value={newGoal.name}
                    onChange={e => setNewGoal({ ...newGoal, name: e.target.value })}
                    className="h-12 input-glass"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Monto objetivo</Label>
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
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleAddGoal}
                  className="w-full h-12 bg-primary hover:bg-primary/90"
                >
                  Crear Meta
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
            <div className="grid gap-4">
              {goals.map((goal, index) => {
                const targetWithDeficit = goal.targetAmount + goal.accumulatedDeficit;
                const progress = goal.period === 'daily'
                  ? (todayIncome / targetWithDeficit) * 100
                  : (goal.currentAmount / targetWithDeficit) * 100;
                const isOnTrack = progress >= 100;
                const deficit = Math.max(0, targetWithDeficit - (goal.period === 'daily' ? todayIncome : goal.currentAmount));

                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-card p-5"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Target className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-display font-semibold">{goal.name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            Meta {goal.period === 'daily' ? 'diaria' : goal.period === 'weekly' ? 'semanal' : 'mensual'}
                          </p>
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
                          className="h-9 w-9 text-muted-foreground hover:text-expense"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2 mb-4">
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
                          ${(goal.period === 'daily' ? todayIncome : goal.currentAmount).toLocaleString()} 
                          {' '}de ${targetWithDeficit.toLocaleString()}
                        </span>
                        <span className={cn('font-medium', isOnTrack ? 'text-income' : 'text-warning')}>
                          {Math.min(progress, 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Deficit Warning */}
                    {!isOnTrack && deficit > 0 && goal.period === 'daily' && (
                      <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 mb-4">
                        <div className="flex items-start gap-2">
                          <TrendingUp className="h-4 w-4 text-warning mt-0.5" />
                          <div className="text-sm">
                            <p className="text-warning font-medium">
                              Déficit proyectado: ${deficit.toLocaleString()}
                            </p>
                            <p className="text-muted-foreground">
                              Meta mañana: ${(goal.targetAmount + deficit).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {goal.accumulatedDeficit > 0 && (
                      <p className="text-xs text-muted-foreground mb-4">
                        Déficit acumulado de días anteriores: ${goal.accumulatedDeficit.toLocaleString()}
                      </p>
                    )}

                    {goal.period === 'daily' && (
                      <Button
                        variant="outline"
                        onClick={() => handleEndDay(goal)}
                        className="w-full"
                      >
                        Cerrar día y calcular déficit
                      </Button>
                    )}
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
