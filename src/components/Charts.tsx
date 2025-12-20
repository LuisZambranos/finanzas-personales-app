// src/components/Charts.tsx
import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useFinance } from '@/contexts/FinanceContext';
import { motion } from 'framer-motion';

export function ExpenseChart() {
  const { transactions } = useFinance();

  const expensesByCategory = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const categoryMap = new Map<string, { amount: number; color: string }>();

    expenses.forEach(expense => {
      const existing = categoryMap.get(expense.category);
      if (existing) {
        existing.amount += expense.netAmount;
      } else {
        categoryMap.set(expense.category, {
          amount: expense.netAmount,
          color: expense.color,
        });
      }
    });

    return Array.from(categoryMap.entries()).map(([name, data]) => ({
      name,
      value: data.amount,
      color: data.color,
    }));
  }, [transactions]);

  if (expensesByCategory.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5 h-[300px] flex items-center justify-center"
      >
        <p className="text-muted-foreground">No hay gastos registrados</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5"
    >
      <h3 className="font-display font-semibold mb-4">Gastos por Categoría</h3>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={expensesByCategory}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
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
              formatter={(value: string) => (
                <span className="text-foreground text-sm">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

export function IncomeExpenseChart() {
  const { transactions } = useFinance();

  const chartData = useMemo(() => {
    // Group by date
    const dateMap = new Map<string, { income: number; expenses: number }>();

    transactions.forEach(t => {
      const date = t.date;
      const existing = dateMap.get(date) || { income: 0, expenses: 0 };
      
      if (t.type === 'income') {
        existing.income += t.netAmount;
      } else {
        existing.expenses += t.netAmount;
      }
      
      dateMap.set(date, existing);
    });

    return Array.from(dateMap.entries())
      .map(([dateString, data]) => {
        // --- CORRECCIÓN DE FECHA AQUÍ ---
        // Rompemos el string "YYYY-MM-DD" para crear la fecha localmente
        // y evitar que Javascript le reste horas por zona horaria.
        const [year, month, day] = dateString.split('-').map(Number);
        const localDate = new Date(year, month - 1, day);

        return {
          dateObj: localDate, // Guardamos objeto fecha para ordenar
          date: localDate.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
          Ingresos: data.income,
          Gastos: data.expenses,
        };
      })
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime()) // Ordenamos por fecha real
      .slice(-14); // Últimos 14 días con movimientos
  }, [transactions]);

  if (chartData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5 h-[300px] flex items-center justify-center"
      >
        <p className="text-muted-foreground">No hay datos para mostrar</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5"
    >
      <h3 className="font-display font-semibold mb-4">Ingresos vs Gastos</h3>
      <div className="h-[250px]">
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
      </div>
    </motion.div>
  );
}