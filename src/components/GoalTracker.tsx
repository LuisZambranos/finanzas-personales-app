// src/components/GoalTracker.tsx
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '@/contexts/FinanceContext';
import { Target, TrendingUp, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { cn, parseLocalDate, formatLocalDate, getLocalDateISOString } from '@/lib/utils';

export function GoalTracker() {
  const { goals, transactions } = useFinance();

  // Calcular datos para TODAS las metas
  const goalsData = useMemo(() => {
    const today = getLocalDateISOString();
    const todayDate = parseLocalDate(today);
    todayDate.setHours(0, 0, 0, 0);

    return goals.map(goal => {
      const start = parseLocalDate(goal.startDate);
      const endDateObj = goal.endDate ? parseLocalDate(goal.endDate) : new Date();

      // Filtrar transacciones en el rango
      const relevantTxs = transactions.filter(t => {
        const tDate = parseLocalDate(t.date);
        const isAfterStart = tDate >= start;
        const isBeforeEnd = goal.endDate ? tDate <= parseLocalDate(goal.endDate) : true;
        return isAfterStart && isBeforeEnd;
      });

      // Calcular ingresos y gastos
      const totalIncome = relevantTxs
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.netAmount, 0);
      
      const totalExpenses = relevantTxs
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.netAmount, 0);

      const netBalance = totalIncome - totalExpenses;

      // Calcular métrica según período
      let currentMetric = 0;
      let progress = 0;
      let statusText = '';

      if (goal.period === 'daily') {
        // PROMEDIO DIARIO
        const diffTime = Math.max(0, todayDate.getTime() - start.getTime());
        const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        const dailyAverage = daysPassed > 0 ? netBalance / daysPassed : netBalance;
        
        currentMetric = dailyAverage;
        progress = goal.targetAmount > 0 ? (dailyAverage / goal.targetAmount) * 100 : 0;
        statusText = `$${dailyAverage.toLocaleString(undefined, {maximumFractionDigits: 0})}/día promedio`;
      
      } else {
        // ACUMULADO (semanal/mensual)
        currentMetric = netBalance;
        progress = goal.targetAmount > 0 ? (netBalance / goal.targetAmount) * 100 : 0;
        statusText = `$${netBalance.toLocaleString(undefined, {maximumFractionDigits: 0})} acumulado`;
      }

      const isOnTrack = currentMetric >= goal.targetAmount;
      const deficit = Math.max(0, goal.targetAmount - currentMetric);

      return {
        goal,
        currentMetric,
        progress,
        isOnTrack,
        deficit,
        statusText,
        totalIncome,
        totalExpenses
      };
    });
  }, [goals, transactions]);

  if (goals.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-semibold flex items-center gap-2">
        <Target className="h-5 w-5 text-primary" />
        Metas Activas
      </h2>

      {goalsData.map((data, index) => {
        const { goal, currentMetric, progress, isOnTrack, deficit, statusText } = data;

        return (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold">{goal.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">
                      {goal.period === 'daily' ? 'Promedio Diario' : 
                       goal.period === 'weekly' ? 'Semanal' : 'Mensual'}
                    </span>
                    <span>•</span>
                    <Calendar className="h-3 w-3" />
                    <span>{formatLocalDate(goal.startDate)}</span>
                  </div>
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
                  {statusText}
                </span>
                <span className={cn(
                  'font-medium',
                  isOnTrack ? 'text-income' : 'text-warning'
                )}>
                  {progress.toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Meta: ${goal.targetAmount.toLocaleString()}</span>
                <span>Actual: ${currentMetric.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
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
                      {goal.period === 'daily' ? 'Mejora tu promedio en:' : 'Te faltan:'} 
                      ${deficit.toLocaleString(undefined, {maximumFractionDigits: 0})}
                    </p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Balance post-gastos considerado
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}