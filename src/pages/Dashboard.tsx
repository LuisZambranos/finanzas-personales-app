import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFinance } from '@/contexts/FinanceContext';
import { Layout } from '@/components/Layout';
import { KPICards } from '@/components/KPICards';
import { ExpenseChart, IncomeExpenseChart } from '@/components/Charts';
import { GoalTracker } from '@/components/GoalTracker';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { PlusCircle, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { transactions } = useFinance();

  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.netAmount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.netAmount, 0);

    const netBalance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    return { totalIncome, totalExpenses, netBalance, savingsRate };
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

        {/* Goal Tracker */}
        <GoalTracker />

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
                      {new Date(transaction.date).toLocaleDateString('es-MX', {
                        month: 'short',
                        day: 'numeric',
                      })}
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
    </Layout>
  );
}
