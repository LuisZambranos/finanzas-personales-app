import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Transaction, Goal, CategoryColor, Recurrence, DEFAULT_CATEGORIES } from '@/types/finance';

interface FinanceContextType {
  transactions: Transaction[];
  goals: Goal[];
  recurrences: Recurrence[];
  categoryColors: CategoryColor[];
  availableCategories: { income: string[]; expense: string[] }; // NUEVO: Para listas dinámicas
  isLoadingData: boolean;
  
  // Transactions
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, createRecurrence?: boolean) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  // Goals
  addGoal: (goal: Omit<Goal, 'id' | 'userId'>) => Promise<void>;
  updateGoal: (id: string, goal: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  // Recurrences
  addRecurrence: (recurrence: Omit<Recurrence, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateRecurrence: (id: string, recurrence: Partial<Recurrence>) => Promise<void>;
  deleteRecurrence: (id: string) => Promise<void>;
  checkRecurrences: () => Promise<void>;

  // Helpers y Utilidades
  getCategoryColor: (category: string) => string | null;
  getMostUsedColor: (category: string) => string | null;
  calculateAmortizedAmount: (amount: number, fromFreq: string, toPeriod: string) => number; // NUEVO: Matemáticas para metas
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recurrences, setRecurrences] = useState<Recurrence[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // 1. ESCUCHAR CAMBIOS (Arquitectura de Colecciones Raíz)
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setGoals([]);
      setRecurrences([]);
      setIsLoadingData(false);
      return;
    }

    setIsLoadingData(true);

    // --- A. Transacciones ---
    const qTrx = query(
      collection(db, 'transactions'), 
      where('userId', '==', user.id),
      orderBy('date', 'desc')
    );

    const unsubscribeTrx = onSnapshot(qTrx, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          createdAt: doc.data().createdAt?.toDate?.().toISOString() || new Date().toISOString(),
          updatedAt: doc.data().updatedAt?.toDate?.().toISOString() || new Date().toISOString(),
      } as Transaction));
      setTransactions(data);
    });

    // --- B. Metas ---
    const qGoals = query(
      collection(db, 'goals'), 
      where('userId', '==', user.id)
    );

    const unsubscribeGoals = onSnapshot(qGoals, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as Goal));
      setGoals(data);
    });

    // --- C. Recurrencias ---
    const qRecurrences = query(
        collection(db, 'recurrences'),
        where('userId', '==', user.id)
    );

    const unsubscribeRecurrences = onSnapshot(qRecurrences, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        } as Recurrence));
        setRecurrences(data);
        setIsLoadingData(false);
    }, (error) => {
        console.error("Error cargando datos:", error);
        setIsLoadingData(false);
    });

    return () => {
      unsubscribeTrx();
      unsubscribeGoals();
      unsubscribeRecurrences();
    };
  }, [user]);

  // 2. LÓGICA DE COLORES (Intacta)
  const categoryColors: CategoryColor[] = useMemo(() => {
    const colorMap = new Map<string, Map<string, number>>();
    transactions.forEach(t => {
      if (!colorMap.has(t.category)) colorMap.set(t.category, new Map());
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
      if (mostUsedColor) result.push({ category, color: mostUsedColor, count: maxCount });
    });
    return result;
  }, [transactions]);

  // 3. NUEVO: Categorías Dinámicas (Une las por defecto con las que invente el usuario)
  const availableCategories = useMemo(() => {
    const customIncome = new Set(transactions.filter(t => t.type === 'income').map(t => t.category));
    const customExpense = new Set(transactions.filter(t => t.type === 'expense').map(t => t.category));
    
    return {
      income: Array.from(new Set([...DEFAULT_CATEGORIES.income, ...customIncome])),
      expense: Array.from(new Set([...DEFAULT_CATEGORIES.expense, ...customExpense]))
    };
  }, [transactions]);

  // 4. FUNCIONES CRUD

  // --- TRANSACCIONES (Actualizada para recurrencia) ---
  const addTransaction = async (
    transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, 
    createRecurrence = false
  ) => {
    if (!user) return;
    
    // 1. Guardar la transacción normal
    await addDoc(collection(db, 'transactions'), {
      ...transaction,
      userId: user.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 2. Si el usuario pidió crear regla recurrente y no es pago único
    if (createRecurrence && transaction.frequency !== 'one-time') {
      let nextDate = new Date(transaction.date);
      // Calcular siguiente fecha
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
        amount: transaction.grossAmount,
        frequency: transaction.frequency, // Hereda la frecuencia seleccionada
        nextPaymentDate: nextDate.toISOString().split('T')[0],
        active: true,
        createdAt: serverTimestamp()
      });
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!user) return;
    await updateDoc(doc(db, 'transactions', id), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'transactions', id));
  };

  // --- METAS ---
  const addGoal = async (goal: Omit<Goal, 'id' | 'userId'>) => {
    if (!user) return;
    await addDoc(collection(db, 'goals'), { 
        ...goal, 
        userId: user.id,
        offDays: goal.offDays || [] // Aseguramos que se cree el array vacío si no existe
    });
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    if (!user) return;
    await updateDoc(doc(db, 'goals', id), updates);
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'goals', id));
  };

  // --- RECURRENCIAS ---
  const addRecurrence = async (recurrence: Omit<Recurrence, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    await addDoc(collection(db, 'recurrences'), {
        ...recurrence,
        userId: user.id,
        createdAt: serverTimestamp()
    });
  };

  const updateRecurrence = async (id: string, updates: Partial<Recurrence>) => {
    if (!user) return;
    await updateDoc(doc(db, 'recurrences', id), updates);
  };

  const deleteRecurrence = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'recurrences', id));
  };

  const checkRecurrences = async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];

    recurrences.forEach(async (rec) => {
        if (rec.active && rec.nextPaymentDate <= today) {
            await addTransaction({
                type: rec.type,
                category: rec.category,
                description: `Recurrente: ${rec.name}`,
                grossAmount: rec.amount,
                netAmount: rec.amount,
                deductionPercentage: 0,
                color: '#8b5cf6',
                date: today,
                frequency: rec.frequency, // Mantiene la frecuencia en la nueva transacción
                isRecurringRule: false // Esta es la hija, no crea otra regla
            });

            const nextDate = new Date(rec.nextPaymentDate);
            if (rec.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
            if (rec.frequency === 'bi-weekly') nextDate.setDate(nextDate.getDate() + 15);
            if (rec.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
            if (rec.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);

            await updateRecurrence(rec.id, {
                nextPaymentDate: nextDate.toISOString().split('T')[0]
            });
        }
    });
  };

  // 5. NUEVO: Función matemática para amortizar montos (Mensual -> Diario)
  const calculateAmortizedAmount = (amount: number, fromFreq: string, toPeriod: string): number => {
    let dailyValue = 0;
    
    // Convertir origen a valor diario
    switch (fromFreq) {
      case 'one-time': dailyValue = amount; break; // Se maneja especial abajo
      case 'daily': dailyValue = amount; break;
      case 'weekly': dailyValue = amount / 7; break;
      case 'bi-weekly': dailyValue = amount / 15; break;
      case 'monthly': dailyValue = amount / 30; break;
      case 'yearly': dailyValue = amount / 365; break;
      default: dailyValue = amount;
    }

    // Excepción: Si es 'one-time' (ej. me encontré dinero) y la meta es diaria, cuenta todo hoy.
    if (fromFreq === 'one-time' && toPeriod === 'daily') return amount;

    // Convertir valor diario al periodo destino
    switch (toPeriod) {
      case 'daily': return dailyValue;
      case 'weekly': return dailyValue * 7;
      case 'monthly': return dailyValue * 30;
      case 'yearly': return dailyValue * 365;
      default: return amount;
    }
  };

  const getCategoryColor = (category: string) => categoryColors.find(c => c.category === category)?.color || null;
  const getMostUsedColor = (category: string) => getCategoryColor(category);

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        goals,
        recurrences,
        categoryColors,
        availableCategories, // Exportamos
        isLoadingData,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addGoal,
        updateGoal,
        deleteGoal,
        addRecurrence,
        updateRecurrence,
        deleteRecurrence,
        checkRecurrences,
        getCategoryColor,
        getMostUsedColor,
        calculateAmortizedAmount // Exportamos
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (context === undefined) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
}