import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '@/contexts/FinanceContext';
import { Target, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function GoalTracker() {
  // 1. Traemos la nueva función 'calculateAmortizedAmount'
  const { goals, transactions, calculateAmortizedAmount } = useFinance();

  const dailyStats = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filtramos transacciones solo del MES ACTUAL para evitar procesar todo el historial
    const currentMonthTransactions = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    
    // --- CÁLCULO INTELIGENTE DE INGRESO DIARIO ---
    const todayIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => {
        // Caso A: Ingreso Único (ej. Venta de garaje) -> Solo cuenta si fue HOY
        if (t.frequency === 'one-time') {
          return t.date === today ? sum + t.netAmount : sum;
        }
        
        // Caso B: Ingreso Recurrente (ej. Sueldo Mensual) -> Se divide proporcionalmente
        // Esto usa la función que creamos en el Contexto
        return sum + calculateAmortizedAmount(t.netAmount, t.frequency, 'daily');
      }, 0);
    
    // --- CÁLCULO DE GASTOS (Misma lógica, útil para futuro) ---
    const todayExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => {
        if (t.frequency === 'one-time') {
          return t.date === today ? sum + t.netAmount : sum;
        }
        return sum + calculateAmortizedAmount(t.netAmount, t.frequency, 'daily');
      }, 0);

    return { todayIncome, todayExpenses };
  }, [transactions, calculateAmortizedAmount]);

  // Buscamos la meta configurada como "Diaria"
  const dailyGoal = goals.find(g => g.period === 'daily');

  if (!dailyGoal) {
    return null;
  }

  const targetWithDeficit = dailyGoal.targetAmount + (dailyGoal.accumulatedDeficit || 0);
  // Evitamos división por cero
  const progress = targetWithDeficit > 0 ? (dailyStats.todayIncome / targetWithDeficit) * 100 : 0;
  const isOnTrack = dailyStats.todayIncome >= targetWithDeficit;
  const deficit = Math.max(0, targetWithDeficit - dailyStats.todayIncome);

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
            ${dailyStats.todayIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })} de ${targetWithDeficit.toLocaleString()}
          </span>
          <span className={cn(
            'font-medium',
            isOnTrack ? 'text-income' : 'text-warning'
          )}>
            {progress.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Deficit Alert - Solo si no vamos bien */}
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
                Faltan ${deficit.toLocaleString(undefined, { maximumFractionDigits: 0 })} para la meta
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                (Incluye parte proporcional de tus ingresos mensuales)
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Muestra déficit histórico si existe */}
      {(dailyGoal.accumulatedDeficit || 0) > 0 && (
        <div className="text-xs text-muted-foreground">
          Déficit acumulado de días previos: ${dailyGoal.accumulatedDeficit?.toLocaleString()}
        </div>
      )}
    </motion.div>
  );
}