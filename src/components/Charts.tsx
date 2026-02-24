// src/components/Charts.tsx
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useFinance } from '@/contexts/FinanceContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function IncomeExpenseChart() {
  const { transactions } = useFinance();
  
  const [currentDate, setCurrentDate] = useState(new Date());

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const chartData = useMemo(() => {
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = String(i + 1).padStart(2, '0');
      const dateQuery = `${monthStr}-${day}`;
      
      const localDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
      const dateString = localDate.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
      
      const dayTxs = transactions.filter(t => t.date === dateQuery);
      
      return {
        date: dateString,
        Ingresos: dayTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.netAmount, 0),
        Gastos: dayTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.netAmount, 0)
      };
    });
  }, [transactions, currentDate, monthStr]);

  return (
    <div className="glass-card p-4 sm:p-5 flex flex-col min-w-0">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-3">
        <h3 className="font-display font-semibold mb-0 hidden sm:block">Ingresos vs Gastos</h3>
        
        <div className="flex items-center gap-3 bg-secondary/30 rounded-full px-2 py-1 w-full sm:w-auto justify-between sm:justify-center">
          <button onClick={prevMonth} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium capitalize min-w-[120px] text-center">{monthName}</span>
          <button onClick={nextMonth} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="h-[250px] w-full relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div 
            key={monthStr} 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }} 
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(160, 84%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(160, 84%, 45%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 72%, 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(0, 72%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(215, 20%, 55%)" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke="hsl(215, 20%, 55%)" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="glass-card p-3">
                          <p className="font-medium mb-2">{label}</p>
                          {payload.map((entry, index) => (
                            <p
                              key={index}
                              className={entry.dataKey === 'Ingresos' ? 'text-income' : 'text-expense'}
                            >
                              {entry.dataKey}: ${(entry.value as number).toLocaleString()}
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="Ingresos"
                  stroke="hsl(160, 84%, 45%)"
                  fillOpacity={1}
                  fill="url(#incomeGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="Gastos"
                  stroke="hsl(0, 72%, 60%)"
                  fillOpacity={1}
                  fill="url(#expenseGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export function ExpenseChart() {
  const { transactions } = useFinance();
  
  const [viewMode, setViewMode] = useState<'monthly' | 'global'>('monthly');
  const toggleView = () => setViewMode(v => v === 'monthly' ? 'global' : 'monthly');

  const today = new Date();
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const expensesByCategory = useMemo(() => {
    const expenses = transactions.filter(t => 
      t.type === 'expense' && (viewMode === 'global' || t.date.startsWith(currentMonthStr))
    );
    const categoryMap = new Map<string, { amount: number; color: string }>();

    expenses.forEach(expense => {
      const existing = categoryMap.get(expense.category);
      if (existing) {
        existing.amount += expense.netAmount;
      } else {
        categoryMap.set(expense.category, {
          amount: expense.netAmount,
          color: expense.color || '#888',
        });
      }
    });

    return Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name,
        value: data.amount,
        color: data.color,
      }))
      .sort((a,b) => b.value - a.value);
  }, [transactions, viewMode, currentMonthStr]);

  const title = viewMode === 'monthly' ? 'Mes Actual' : 'Histórico Global';

  return (
    <div className="glass-card p-4 sm:p-5 flex flex-col min-w-0">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-3">
        <h3 className="font-display font-semibold mb-0 hidden sm:block">Gastos por Categoría</h3>
        
        <div className="flex items-center gap-3 bg-secondary/30 rounded-full px-2 py-1 w-full sm:w-auto justify-between sm:justify-center cursor-pointer select-none" onClick={toggleView}>
          <button className="p-1.5 rounded-full hover:bg-secondary transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium min-w-[120px] text-center text-primary">{title}</span>
          <button className="p-1.5 rounded-full hover:bg-secondary transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="h-[250px] w-full relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div 
            key={viewMode}
            initial={{ opacity: 0, scale: 0.95, x: 20 }} 
            animate={{ opacity: 1, scale: 1, x: 0 }} 
            exit={{ opacity: 0, scale: 0.95, x: -20 }} 
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            {expensesByCategory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
                <p>No hay gastos registrados</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
  <PieChart>
    <Pie
      data={expensesByCategory}
      cx="50%"
      cy="45%"
      innerRadius={65}
      outerRadius={90}
      paddingAngle={3}
      dataKey="value"
      stroke="none"
    >
      {expensesByCategory.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={entry.color} />
      ))}
    </Pie>
    <Tooltip
      content={({ active, payload }) => {
        if (active && payload && payload.length) {
          const data = payload[0].payload;
          return (
            <div className="glass-card p-3">
              <p className="font-medium">{data.name}</p>
              <p className="text-expense">${data.value.toLocaleString()}</p>
            </div>
          );
        }
        return null;
      }}
    />
    <Legend
      verticalAlign="bottom"
      height={40}
      iconType="circle"
      wrapperStyle={{ fontSize: '12px', paddingTop: '5px' }}
      formatter={(value: string, entry: any) => (
        <span style={{ color: entry.color }} className="text-sm font-medium">
          {value}
        </span>
      )}
    />
  </PieChart>
</ResponsiveContainer>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}