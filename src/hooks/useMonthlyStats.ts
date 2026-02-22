// src/hooks/useMonthlyStats.ts
import { useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { parseLocalDate } from '@/lib/utils';

export function useMonthlyStats() {
  const { transactions } = useFinance();

  return useMemo(() => {
    const sortedTxs = [...transactions].sort((a, b) => 
      parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime()
    );

    const monthsMap = new Map();
    let globalAccumulated = 0;

    sortedTxs.forEach(tx => {
      const date = parseLocalDate(tx.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthsMap.has(monthKey)) {
        // AHORA GUARDAMOS ARREGLOS DE TRANSACCIONES AQUÍ
        monthsMap.set(monthKey, { 
          income: 0, 
          expense: 0, 
          date: date,
          incomeTxs: [],
          expenseTxs: []
        });
      }
      
      const monthStats = monthsMap.get(monthKey);
      
      if (tx.type === 'income') {
        monthStats.income += tx.netAmount; 
        monthStats.incomeTxs.push(tx); // Guardamos la transacción de ingreso
      } else {
        monthStats.expense += tx.netAmount;
        monthStats.expenseTxs.push(tx); // Guardamos la transacción de gasto
      }
    });

    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const stats = Array.from(monthsMap.entries()).map(([key, data]) => {
      const monthlySaved = data.income - data.expense;
      globalAccumulated += monthlySaved;

      return {
        id: key,
        label: data.date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
        income: data.income,
        expense: data.expense,
        monthlySaved: monthlySaved,
        accumulatedSavings: globalAccumulated,
        isCompleted: key < currentMonthKey,
        // EXPORTAMOS LAS TRANSACCIONES PARA USARLAS EN EL MODAL
        incomeTxs: data.incomeTxs,
        expenseTxs: data.expenseTxs
      };
    });

    return stats;
  }, [transactions]);
}