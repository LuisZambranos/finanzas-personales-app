import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { 
  collection, 
  query, 
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
import { Transaction, Goal, CategoryColor } from '@/types/finance';

interface FinanceContextType {
  transactions: Transaction[];
  goals: Goal[];
  categoryColors: CategoryColor[];
  isLoadingData: boolean;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>;
  updateGoal: (id: string, goal: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  getCategoryColor: (category: string) => string | null;
  getMostUsedColor: (category: string) => string | null;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // 1. ESCUCHAR CAMBIOS EN FIRESTORE EN TIEMPO REAL
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setGoals([]);
      setIsLoadingData(false);
      return;
    }

    setIsLoadingData(true);

    // Referencias a las subcolecciones del usuario
    const transactionsRef = collection(db, 'users', user.id, 'transactions');
    const goalsRef = collection(db, 'users', user.id, 'goals');
    
    // Query para ordenar transacciones por fecha (más reciente primero)
    const qTrx = query(transactionsRef, orderBy('date', 'desc'));

    // Suscripción a Transacciones
    const unsubscribeTrx = onSnapshot(qTrx, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          ...d,
          id: doc.id,
          // Convertimos los Timestamps de Firestore a string para la app
          createdAt: d.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
          updatedAt: d.updatedAt?.toDate?.().toISOString() || new Date().toISOString(),
        } as Transaction;
      });
      setTransactions(data);
      setIsLoadingData(false);
    }, (error) => {
      console.error("Error leyendo transacciones:", error);
      setIsLoadingData(false);
    });

    // Suscripción a Metas
    const unsubscribeGoals = onSnapshot(goalsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as Goal));
      setGoals(data);
    });

    // Limpieza al desmontar
    return () => {
      unsubscribeTrx();
      unsubscribeGoals();
    };
  }, [user]);

  // 2. LÓGICA DE COLORES (Se mantiene igual, procesa los datos locales)
  const categoryColors: CategoryColor[] = useMemo(() => {
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

  // 3. FUNCIONES CRUD CONECTADAS A FIRESTORE
  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.id, 'transactions'), {
        ...transaction,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error agregando transacción:", error);
      throw error;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.id, 'transactions', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error actualizando transacción:", error);
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.id, 'transactions', id));
    } catch (error) {
      console.error("Error eliminando transacción:", error);
      throw error;
    }
  };

  const addGoal = async (goal: Omit<Goal, 'id'>) => {
    if (!user) return;
    try {
        await addDoc(collection(db, 'users', user.id, 'goals'), goal);
    } catch (error) {
        console.error("Error agregando meta:", error);
        throw error;
    }
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    if (!user) return;
    try {
        const docRef = doc(db, 'users', user.id, 'goals', id);
        await updateDoc(docRef, updates);
    } catch (error) {
        console.error("Error actualizando meta:", error);
        throw error;
    }
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;
    try {
        await deleteDoc(doc(db, 'users', user.id, 'goals', id));
    } catch (error) {
        console.error("Error eliminando meta:", error);
        throw error;
    }
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
        isLoadingData,
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