import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction, Goal, CategoryColor } from '@/types/finance';
import { v4 as uuidv4 } from 'uuid';

interface FinanceContextType {
  transactions: Transaction[];
  goals: Goal[];
  categoryColors: CategoryColor[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (id: string, goal: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  getCategoryColor: (category: string) => string | null;
  getMostUsedColor: (category: string) => string | null;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const TRANSACTIONS_KEY = 'finanzas_transactions';
const GOALS_KEY = 'finanzas_goals';

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const storedTransactions = localStorage.getItem(TRANSACTIONS_KEY);
    const storedGoals = localStorage.getItem(GOALS_KEY);

    if (storedTransactions) {
      try {
        setTransactions(JSON.parse(storedTransactions));
      } catch {
        console.error('Error parsing transactions');
      }
    }

    if (storedGoals) {
      try {
        setGoals(JSON.parse(storedGoals));
      } catch {
        console.error('Error parsing goals');
      }
    }
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  }, [goals]);

  // Calculate category colors from transactions
  const categoryColors: CategoryColor[] = React.useMemo(() => {
    const colorMap = new Map<string, Map<string, number>>();
    
    transactions.forEach(t => {
      if (!colorMap.has(t.category)) {
        colorMap.set(t.category, new Map());
      }
      const categoryMap = colorMap.get(t.category)!;
      categoryMap.set(t.color, (categoryMap.get(t.color) || 0) + 1);
    });

    const result: CategoryColor[] = [];
    colorMap.forEach((colors, category) => {
      let maxCount = 0;
      let mostUsedColor = '';
      colors.forEach((count, color) => {
        if (count > maxCount) {
          maxCount = count;
          mostUsedColor = color;
        }
      });
      if (mostUsedColor) {
        result.push({ category, color: mostUsedColor, count: maxCount });
      }
    });

    return result;
  }, [transactions]);

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newTransaction: Transaction = {
      ...transaction,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev =>
      prev.map(t =>
        t.id === id
          ? { ...t, ...updates, updatedAt: new Date().toISOString() }
          : t
      )
    );
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const addGoal = (goal: Omit<Goal, 'id'>) => {
    const newGoal: Goal = {
      ...goal,
      id: uuidv4(),
    };
    setGoals(prev => [newGoal, ...prev]);
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    setGoals(prev =>
      prev.map(g => (g.id === id ? { ...g, ...updates } : g))
    );
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const getCategoryColor = (category: string): string | null => {
    const found = categoryColors.find(c => c.category.toLowerCase() === category.toLowerCase());
    return found?.color || null;
  };

  const getMostUsedColor = (category: string): string | null => {
    return getCategoryColor(category);
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        goals,
        categoryColors,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addGoal,
        updateGoal,
        deleteGoal,
        getCategoryColor,
        getMostUsedColor,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
