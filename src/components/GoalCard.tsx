// src/components/GoalCard.tsx
import { motion } from 'framer-motion';
import { Target, Trash2, TrendingUp, CheckCircle, Calendar, Eye, CalendarOff, AlertTriangle, CreditCard } from 'lucide-react';
import { cn, parseLocalDate } from '@/lib/utils';
import { Goal, Transaction } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useFinance } from '@/contexts/FinanceContext';

interface GoalCardProps {
  goal: Goal;
  index?: number;
  onDelete?: (id: string) => void;
  onViewDetails?: (goal: Goal, txs: Transaction[]) => void;
  onManageOffDays?: (goal: Goal) => void;
}

export function GoalCard({ goal, index = 0, onDelete, onViewDetails, onManageOffDays }: GoalCardProps) {
  const { transactions } = useFinance();

  const calculateProgress = () => {
    const start = parseLocalDate(goal.startDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const startStr = goal.startDate;

    const isDebt = goal.type === 'debt';

    // Filtrar transacciones del período
    const relevantTxs = transactions.filter(t => {
      const tDate = parseLocalDate(t.date);
      const isAfterStart = tDate >= start;
      const isBeforeEnd = goal.endDate ? tDate <= parseLocalDate(goal.endDate) : true; 
      
      // Si es deuda, SOLO nos importan los gastos de la categoría vinculada
      if (isDebt && goal.linkedCategory) {
        return isAfterStart && isBeforeEnd && t.type === 'expense' && t.category.toLowerCase() === goal.linkedCategory.toLowerCase();
      }
      return isAfterStart && isBeforeEnd;
    });

    let currentMetric = 0;
    let progress = 0;
    let statusText = '';
    let metricLabel = '';

    if (isDebt) {
      // --- LÓGICA DE DEUDA ---
      const totalPaid = relevantTxs.reduce((sum, t) => sum + t.netAmount, 0);
      currentMetric = totalPaid;
      progress = (totalPaid / goal.targetAmount) * 100;
      
      // CONTEO DE CUOTAS
      const cuotasPagadas = relevantTxs.length;
      
      statusText = `Pagado: $${totalPaid.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
      
      // MOSTRAR "X de Y cuotas" o "X pagos realizados"
      metricLabel = goal.totalInstallments 
        ? `Categoría: ${goal.linkedCategory} (${cuotasPagadas} de ${goal.totalInstallments} cuotas)` 
        : `Categoría: ${goal.linkedCategory} (${cuotasPagadas} pagos realizados)`;
        
    } else {
      // --- LÓGICA DE AHORRO ---
      const totalIncome = relevantTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.netAmount, 0);
      const totalExpense = relevantTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.netAmount, 0);
      const netBalance = totalIncome - totalExpense;

      const diffTime = Math.max(0, today.getTime() - start.getTime());
      const totalDaysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      const validOffDays = (goal.offDays || []).filter(dateStr => dateStr >= startStr && dateStr <= todayStr).length;
      const effectiveDays = Math.max(1, totalDaysPassed - validOffDays);
      const dailyAverage = effectiveDays > 0 ? (netBalance / effectiveDays) : netBalance;

      if (goal.period === 'daily') {
        currentMetric = dailyAverage;
        progress = (dailyAverage / goal.targetAmount) * 100;
        statusText = `Promedio Diario: $${dailyAverage.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
        metricLabel = `Promedio en ${effectiveDays} días hábiles (${validOffDays} libres)`;
      } else {
        currentMetric = netBalance;
        progress = (netBalance / goal.targetAmount) * 100;
        statusText = `Acumulado: $${netBalance.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
        metricLabel = `Total en ${effectiveDays} días hábiles`;
      }
    }

    const isOnTrack = currentMetric >= goal.targetAmount;
    const deficit = Math.max(0, goal.targetAmount - currentMetric);

    return { progress, deficit, isOnTrack, statusText, metricLabel, currentMetric, relevantTxs, isDebt };
  };

  const { progress, deficit, isOnTrack, statusText, metricLabel, currentMetric, relevantTxs, isDebt } = calculateProgress();

  const formatDateStr = (dateStr: string) => {
    return parseLocalDate(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
      className="glass-card p-5 relative overflow-hidden group space-y-4"
    >
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", isDebt ? "bg-expense/10" : "bg-primary/10")}>
            {isDebt ? <CreditCard className="h-5 w-5 text-expense" /> : <Target className="h-5 w-5 text-primary" />}
          </div>
          <div>
            <h3 className="font-display font-semibold">{goal.name}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={cn("capitalize font-medium", isDebt && "text-expense")}>
                {isDebt ? 'Pago de Deuda' : goal.period === 'daily' ? 'Promedio Diario' : goal.period === 'weekly' ? 'Semanal' : 'Mensual'}
              </span>
              <span>•</span>
              <Calendar className="h-3 w-3" />
              <span>{formatDateStr(goal.startDate)} {goal.endDate ? `- ${formatDateStr(goal.endDate)}` : ''}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {!isDebt && onManageOffDays && (
            <Button variant="ghost" size="icon" onClick={() => onManageOffDays(goal)}
              className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors" title="Días Libres">
              <CalendarOff className="h-4 w-4" />
            </Button>
          )}
          {onViewDetails && (
             <Button variant="ghost" size="icon" onClick={() => onViewDetails(goal, relevantTxs)} 
               className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors">
               <Eye className="h-4 w-4" />
             </Button>
          )}
          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-expense transition-colors">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="glass-card border-border/50">
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar meta?</AlertDialogTitle>
                  <AlertDialogDescription>Se eliminará "{goal.name}" permanentemente.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(goal.id)} className="bg-expense text-white hover:bg-expense/90">Eliminar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {!onDelete && ( 
             isOnTrack ? <CheckCircle className="h-5 w-5 text-income ml-2" /> : <AlertTriangle className="h-5 w-5 text-warning ml-2" />
          )}
        </div>
      </div>

      <div className="space-y-2 relative z-10">
        <div className="h-3 rounded-full bg-secondary overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(progress, 100)}%` }} transition={{ duration: 0.8 }}
            className={cn('h-full rounded-full transition-all', 
              isOnTrack ? 'bg-income' : isDebt ? 'bg-primary' : progress >= 80 ? 'bg-warning' : 'bg-expense'
            )} />
        </div>
        <div className="flex justify-between text-sm items-center">
          <span className="text-muted-foreground">{statusText}</span>
          <span className={cn('font-bold', isOnTrack ? 'text-income' : isDebt ? 'text-primary' : 'text-warning')}>
             {Math.min(progress, 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex justify-between items-center text-[10px] text-muted-foreground">
           <span>Meta: ${goal.targetAmount.toLocaleString()}</span>
           <span>{metricLabel}</span>
        </div>
      </div>

      {!isOnTrack && deficit > 0 && (
        <div className={cn("p-3 rounded-lg border relative z-10", isDebt ? "bg-secondary/30 border-border/50" : "bg-warning/10 border-warning/20")}>
          <div className="flex items-start gap-2">
            <TrendingUp className={cn("h-4 w-4 mt-0.5", isDebt ? "text-primary" : "text-warning")} />
            <div className="text-sm">
              <p className={cn("font-medium", isDebt ? "text-foreground" : "text-warning")}>
                {isDebt ? 'Deuda Restante:' : goal.period === 'daily' ? 'Mejora tu promedio en:' : 'Te faltan:'} ${deficit.toLocaleString(undefined, {maximumFractionDigits: 0})}
              </p>
              <p className="text-muted-foreground text-[10px] mt-1">
                {isDebt ? 'Registra gastos en la categoría seleccionada para avanzar.' : 'Balance post-gastos considerado'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className={cn("absolute -right-4 -bottom-4 h-32 w-32 rounded-full opacity-5 blur-2xl z-0 pointer-events-none", 
        isOnTrack ? "bg-income" : isDebt ? "bg-primary" : "bg-warning"
      )} />
    </motion.div>
  );
}