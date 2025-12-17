import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  collection, query, where, orderBy, onSnapshot, 
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Transaction, Goal, CategoryColor, Recurrence, DEFAULT_CATEGORIES } from '@/types/finance';

interface FinanceContextType {
  transactions: Transaction[];
  goals: Goal[];
  recurrences: Recurrence[];
  availableCategories: { income: string[]; expense: string[] };
  categoryColors: CategoryColor[];
  isLoadingData: boolean;
  
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, createRecurrence?: boolean) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  addGoal: (goal: Omit<Goal, 'id' | 'userId'>) => Promise<void>;
  updateGoal: (id: string, goal: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  addRecurrence: (recurrence: Omit<Recurrence, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  deleteRecurrence: (id: string) => Promise<void>;
  
  getCategoryColor: (category: string) => string | null;
  getMostUsedColor: (category: string) => string | null;
  
  // Helpers de cálculo
  calculateAmortizedAmount: (amount: number, fromFreq: string, toPeriod: string) => number;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recurrences, setRecurrences] = useState<Recurrence[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // 1. CARGA DE DATOS (COLECCIONES SEPARADAS)
  useEffect(() => {
    if (!user) {
      setTransactions([]); setGoals([]); setRecurrences([]); setIsLoadingData(false); return;
    }
    setIsLoadingData(true);

    // Transacciones
    const qTrx = query(collection(db, 'transactions'), where('userId', '==', user.id), orderBy('date', 'desc'));
    const unsubTrx = onSnapshot(qTrx, (snap) => {
      setTransactions(snap.docs.map(d => ({ ...d.data(), id: d.id } as Transaction)));
    });

    // Metas
    const qGoals = query(collection(db, 'goals'), where('userId', '==', user.id));
    const unsubGoals = onSnapshot(qGoals, (snap) => {
      setGoals(snap.docs.map(d => ({ ...d.data(), id: d.id } as Goal)));
    });

    // Recurrencias
    const qRec = query(collection(db, 'recurrences'), where('userId', '==', user.id));
    const unsubRec = onSnapshot(qRec, (snap) => {
      setRecurrences(snap.docs.map(d => ({ ...d.data(), id: d.id } as Recurrence)));
      setIsLoadingData(false); // Asumimos carga lista aquí
    });

    return () => { unsubTrx(); unsubGoals(); unsubRec(); };
  }, [user]);

  // 2. CATEGORÍAS DINÁMICAS (Mezcla defaults + lo que el usuario ha escrito)
  const availableCategories = useMemo(() => {
    const customIncome = new Set(transactions.filter(t => t.type === 'income').map(t => t.category));
    const customExpense = new Set(transactions.filter(t => t.type === 'expense').map(t => t.category));
    
    return {
      income: Array.from(new Set([...DEFAULT_CATEGORIES.income, ...customIncome])),
      expense: Array.from(new Set([...DEFAULT_CATEGORIES.expense, ...customExpense]))
    };
  }, [transactions]);

  // 3. LÓGICA DE COLORES
  const categoryColors: CategoryColor[] = useMemo(() => {
    const colorMap = new Map<string, Map<string, number>>();
    transactions.forEach(t => {
      if (!colorMap.has(t.category)) colorMap.set(t.category, new Map());
      const cMap = colorMap.get(t.category)!;
      cMap.set(t.color, (cMap.get(t.color) || 0) + 1);
    });
    // ... lógica de extracción del color más usado
    const result: CategoryColor[] = [];
    colorMap.forEach((colors, category) => {
      let max = 0; let best = '';
      colors.forEach((cnt, col) => { if (cnt > max) { max = cnt; best = col; } });
      if (best) result.push({ category, color: best, count: max });
    });
    return result;
  }, [transactions]);

  // 4. FUNCIONES CRUD MEJORADAS
  const addTransaction = async (
    transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, 
    createRecurrence = false
  ) => {
    if (!user) return;
    
    // 1. Guardar transacción actual
    await addDoc(collection(db, 'transactions'), {
      ...transaction,
      userId: user.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 2. Si marcó "Recurrente", crear la regla en 'recurrences'
    if (createRecurrence && transaction.frequency !== 'one-time') {
      let nextDate = new Date(transaction.date);
      // Calcular siguiente fecha base
      if (transaction.frequency === 'daily') nextDate.setDate(nextDate.getDate() + 1);
      if (transaction.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
      if (transaction.frequency === 'bi-weekly') nextDate.setDate(nextDate.getDate() + 15);
      if (transaction.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
      if (transaction.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);

      await addDoc(collection(db, 'recurrences'), {
        userId: user.id,
        type: transaction.type,
        category: transaction.category,
        description: transaction.description,
        amount: transaction.grossAmount, // Guardamos monto bruto base
        frequency: transaction.frequency,
        nextPaymentDate: nextDate.toISOString().split('T')[0],
        active: true,
        createdAt: serverTimestamp()
      });
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!user) return;
    await updateDoc(doc(db, 'transactions', id), { ...updates, updatedAt: serverTimestamp() });
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'transactions', id));
  };

  const addGoal = async (goal: Omit<Goal, 'id' | 'userId'>) => {
    if (!user) return;
    await addDoc(collection(db, 'goals'), { ...goal, userId: user.id });
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    if (!user) return;
    await updateDoc(doc(db, 'goals', id), updates);
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'goals', id));
  };

  const addRecurrence = async (rec: Omit<Recurrence, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    await addDoc(collection(db, 'recurrences'), { ...rec, userId: user.id, createdAt: serverTimestamp() });
  };

  const deleteRecurrence = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'recurrences', id));
  };

  // 5. HELPER DE AMORTIZACIÓN (La clave para tus Metas)
  const calculateAmortizedAmount = (amount: number, fromFreq: string, toPeriod: string): number => {
    // Convertir todo a valor DIARIO primero
    let dailyValue = 0;
    switch (fromFreq) {
      case 'one-time': dailyValue = amount; break; // Se cuenta entero el día que ocurre
      case 'daily': dailyValue = amount; break;
      case 'weekly': dailyValue = amount / 7; break;
      case 'bi-weekly': dailyValue = amount / 15; break;
      case 'monthly': dailyValue = amount / 30; break;
      case 'yearly': dailyValue = amount / 365; break;
      default: dailyValue = amount;
    }

    // Si la meta es DIARIA, y el gasto es MENSUAL (ej. sueldo), devolvemos el valor diario.
    // PERO: Si la transacción es 'one-time' (ej. me encontré $100), cuenta full para ese día.
    if (fromFreq === 'one-time' && toPeriod === 'daily') return amount;

    // Convertir valor diario al periodo de la Meta
    switch (toPeriod) {
      case 'daily': return dailyValue;
      case 'weekly': return dailyValue * 7;
      case 'monthly': return dailyValue * 30;
      case 'yearly': return dailyValue * 365;
      default: return amount;
    }
  };

  const getCategoryColor = (cat: string) => categoryColors.find(c => c.category === cat)?.color || null;
  const getMostUsedColor = (cat: string) => getCategoryColor(cat);

  return (
    <FinanceContext.Provider value={{
      transactions, goals, recurrences, availableCategories, categoryColors, isLoadingData,
      addTransaction, updateTransaction, deleteTransaction,
      addGoal, updateGoal, deleteGoal, addRecurrence, deleteRecurrence,
      getCategoryColor, getMostUsedColor, calculateAmortizedAmount
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (context === undefined) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
}