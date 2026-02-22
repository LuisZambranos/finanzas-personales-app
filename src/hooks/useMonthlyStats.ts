// src/hooks/useMonthlyStats.ts
import { useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { parseLocalDate } from '@/lib/utils';

export function useMonthlyStats() {
  const { transactions } = useFinance();

  return useMemo(() => {
    // 1. Ordenamos todas las transacciones cronológicamente
    const sortedTxs = [...transactions].sort((a, b) => 
      parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime()
    );

    const monthsMap = new Map();
    let globalAccumulated = 0; // El pozo histórico

    // 2. Agrupamos por Año-Mes
    sortedTxs.forEach(tx => {
      const date = parseLocalDate(tx.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthsMap.has(monthKey)) {
        monthsMap.set(monthKey, { 
          income: 0, 
          expense: 0, 
          date: date 
        });
      }
      
      const monthStats = monthsMap.get(monthKey);
      
      // AQUÍ ESTÁ LA CORRECCIÓN: Usamos netAmount
      if (tx.type === 'income') {
        monthStats.income += tx.netAmount; 
      } else {
        monthStats.expense += tx.netAmount;
      }
    });

    // 3. Fecha actual para saber qué meses ya cerraron
    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    // 4. Transformamos el mapa en el Array final
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
        isCompleted: key < currentMonthKey
      };
    });

    return stats;
  }, [transactions]);
}