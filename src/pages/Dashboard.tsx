// src/pages/Dashboard.tsx
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFinance } from '@/contexts/FinanceContext';
import { Layout } from '@/components/Layout';
import { KPICards } from '@/components/KPICards';
import { ExpenseChart, IncomeExpenseChart } from '@/components/Charts';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { PlusCircle, ArrowRight, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { cn, formatLocalDate } from '@/lib/utils';
import { GoalCard } from '@/components/GoalCard';
import { ManageOffDaysDialog } from '@/components/ManageOffDaysDialog';
import { Goal } from '@/types/finance';
import { BreakevenWidget } from '@/components/BreakevenWidget';

export default function Dashboard() {
  // 1. Extraemos transactions y goals
  const { transactions, goals } = useFinance();
  
  // 2. Estado para el modal de días libres
  const [managingOffDays, setManagingOffDays] = useState<Goal | null>(null);

  const stats = useMemo(() => {
    const today = new Date();
    // Obtenemos el mes actual en formato YYYY-MM (Ej: "2026-02")
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    let allTimeIncome = 0;
    let allTimeExpenses = 0;
    
    let currentMonthIncome = 0;
    let currentMonthExpenses = 0;

    transactions.forEach(t => {
      // Verificamos si la transacción es de este mes
      const isCurrentMonth = t.date.startsWith(currentMonthStr);

      if (t.type === 'income') {
        allTimeIncome += t.netAmount; // Suma histórica
        if (isCurrentMonth) currentMonthIncome += t.netAmount; // Suma del mes
      } else {
        allTimeExpenses += t.netAmount; // Suma histórica
        if (isCurrentMonth) currentMonthExpenses += t.netAmount; // Suma del mes
      }
    });

    // El balance de las tarjetas será el del mes actual
    const currentMonthNetBalance = currentMonthIncome - currentMonthExpenses;
    
    // El ahorro total será el histórico de toda tu cuenta
    const allTimeNetBalance = allTimeIncome - allTimeExpenses;

    return { 
      totalIncome: currentMonthIncome, 
      totalExpenses: currentMonthExpenses, 
      netBalance: currentMonthNetBalance, 
      totalSavings: allTimeNetBalance // <-- Cambiamos savingsRate por totalSavings
    };
  }, [transactions]);

  const recentTransactions = transactions.slice(0, 5);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">
              <span className="text-gradient">Dashboard</span>
            </h1>
            <p className="text-muted-foreground">Resumen de tus finanzas</p>
          </div>
          <Link to="/new">
            <Button className="bg-primary hover:bg-primary/90 btn-glow gap-2">
              <PlusCircle className="h-4 w-4" />
              Nueva Transacción
            </Button>
          </Link>
        </div>

        {/* KPIs */}
        <KPICards {...stats} />

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          <IncomeExpenseChart />
          <ExpenseChart />
        </div>

        {/* NUEVO: CONTENEDOR ESPECÍFICO PARA EL WIDGET DE PUNTO DE EQUILIBRIO */}
        <div className="w-full">
           <BreakevenWidget />
        </div>

        {/* Goal Tracker (Ahora dinámico con GoalCard) */}
        <div className="space-y-4">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Metas Activas
          </h2>
          {goals.length === 0 ? (
            <div className="glass-card p-6 text-center text-muted-foreground">
              No tienes metas activas.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {goals.map((goal, index) => (
                <GoalCard 
                  key={goal.id} 
                  goal={goal} 
                  index={index}
                  onManageOffDays={setManagingOffDays} 
                />
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold">Transacciones Recientes</h3>
            <Link to="/history">
              <Button variant="ghost" size="sm" className="gap-1 text-primary">
                Ver todo
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground mb-4">No hay transacciones aún</p>
              <Link to="/new">
                <Button variant="outline" className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Agregar primera transacción
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map(transaction => (
                <div
                  key={transaction.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${transaction.color}20` }}
                  >
                    {transaction.type === 'income' ? (
                      <TrendingUp className="h-4 w-4" style={{ color: transaction.color }} />
                    ) : (
                      <TrendingDown className="h-4 w-4" style={{ color: transaction.color }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{transaction.category}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatLocalDate(transaction.date)}
                    </p>
                  </div>
                  <p
                    className={cn(
                      'font-display font-bold',
                      transaction.type === 'income' ? 'text-income' : 'text-expense'
                    )}
                  >
                    {transaction.type === 'income' ? '+' : '-'}${transaction.netAmount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* COMPONENTE DEL MODAL DE DÍAS LIBRES */}
      <ManageOffDaysDialog 
        goal={managingOffDays} 
        isOpen={!!managingOffDays} 
        onClose={() => setManagingOffDays(null)} 
      />
    </Layout>
  );
}