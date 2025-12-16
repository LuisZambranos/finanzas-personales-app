import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '@/contexts/FinanceContext';
import { Target, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function GoalTracker() {
  const { goals, transactions } = useFinance();

  const dailyStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayTransactions = transactions.filter(t => t.date === today);
    
    const todayIncome = todayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.netAmount, 0);
    
    const todayExpenses = todayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.netAmount, 0);

    return { todayIncome, todayExpenses };
  }, [transactions]);

  const dailyGoal = goals.find(g => g.period === 'daily');

  if (!dailyGoal) {
    return null;
  }

  const targetWithDeficit = dailyGoal.targetAmount + dailyGoal.accumulatedDeficit;
  const progress = (dailyStats.todayIncome / targetWithDeficit) * 100;
  const isOnTrack = dailyStats.todayIncome >= targetWithDeficit;
  const deficit = targetWithDeficit - dailyStats.todayIncome;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold">Meta Diaria</h3>
            <p className="text-sm text-muted-foreground">{dailyGoal.name}</p>
          </div>
        </div>
        {isOnTrack ? (
          <CheckCircle className="h-6 w-6 text-income" />
        ) : (
          <AlertTriangle className="h-6 w-6 text-warning" />
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="h-3 rounded-full bg-secondary overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={cn(
              'h-full rounded-full',
              isOnTrack ? 'bg-income' : progress >= 80 ? 'bg-warning' : 'bg-expense'
            )}
          />
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            ${dailyStats.todayIncome.toLocaleString()} de ${targetWithDeficit.toLocaleString()}
          </span>
          <span className={cn(
            'font-medium',
            isOnTrack ? 'text-income' : 'text-warning'
          )}>
            {progress.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Deficit Alert */}
      {!isOnTrack && deficit > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 rounded-lg bg-warning/10 border border-warning/20"
        >
          <div className="flex items-start gap-2">
            <TrendingUp className="h-4 w-4 text-warning mt-0.5" />
            <div className="text-sm">
              <p className="text-warning font-medium">
                Déficit de ${deficit.toLocaleString()}
              </p>
              <p className="text-muted-foreground">
                Meta mañana: ${(dailyGoal.targetAmount + deficit).toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {dailyGoal.accumulatedDeficit > 0 && (
        <div className="text-xs text-muted-foreground">
          Déficit acumulado: ${dailyGoal.accumulatedDeficit.toLocaleString()}
        </div>
      )}
    </motion.div>
  );
}
