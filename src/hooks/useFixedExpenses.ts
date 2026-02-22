// src/hooks/useFixedExpenses.ts
import { useState, useEffect } from 'react';

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
}

export function useFixedExpenses() {
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>(() => {
    const saved = localStorage.getItem('finax_fixed_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  // NUEVO: Estado para los días hábiles del mes
  const [workingDays, setWorkingDays] = useState<number>(() => {
    const saved = localStorage.getItem('finax_working_days');
    return saved ? parseInt(saved) : 30; // 30 por defecto
  });

  useEffect(() => {
    localStorage.setItem('finax_fixed_expenses', JSON.stringify(fixedExpenses));
  }, [fixedExpenses]);

  useEffect(() => {
    localStorage.setItem('finax_working_days', workingDays.toString());
  }, [workingDays]);

  const addFixedExpense = (name: string, amount: number) => {
    const newExpense: FixedExpense = { id: crypto.randomUUID(), name, amount };
    setFixedExpenses(prev => [...prev, newExpense]);
  };

  const removeFixedExpense = (id: string) => {
    setFixedExpenses(prev => prev.filter(e => e.id !== id));
  };

  const totalFixedExpenses = fixedExpenses.reduce((sum, e) => sum + e.amount, 0);

  return { fixedExpenses, addFixedExpense, removeFixedExpense, totalFixedExpenses, workingDays, setWorkingDays };
}