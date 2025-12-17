// src/contexts/FinanceContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, // IMPORTANTE: Necesario para filtrar por usuario
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
import { Transaction, Goal, CategoryColor, Recurrence } from '@/types/finance';

interface FinanceContextType {
  transactions: Transaction[];
  goals: Goal[];
  recurrences: Recurrence[]; // Nuevo estado
  categoryColors: CategoryColor[];
  isLoadingData: boolean;
  
  // Transactions
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  // Goals
  addGoal: (goal: Omit<Goal, 'id' | 'userId'>) => Promise<void>;
  updateGoal: (id: string, goal: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  // Recurrences (Nuevas funciones)
  addRecurrence: (recurrence: Omit<Recurrence, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateRecurrence: (id: string, recurrence: Partial<Recurrence>) => Promise<void>;
  deleteRecurrence: (id: string) => Promise<void>;
  checkRecurrences: () => Promise<void>; // Función para verificar si toca pagar algo hoy

  getCategoryColor: (category: string) => string | null;
  getMostUsedColor: (category: string) => string | null;
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

    // --- A. Transacciones (Filtradas por userId) ---
    // NOTA: Esto requerirá un Índice Compuesto en Firebase (userId + date)
    // Verás un error en consola con un link para crearlo automáticamente. Haz clic en él.
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

  // 2. LÓGICA DE COLORES
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

  // 3. FUNCIONES CRUD

  // --- TRANSACCIONES ---
  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    await addDoc(collection(db, 'transactions'), {
      ...transaction,
      userId: user.id, // Vinculación explícita
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
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
        userId: user.id 
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

  // Función inteligente: Verifica si una recurrencia debe generar una transacción hoy
  const checkRecurrences = async () => {
    // Esta función se puede llamar al cargar el Dashboard
    // Compara nextPaymentDate con today. Si pasó, crea la transacción y actualiza nextPaymentDate.
    // (Implementación básica para poner a prueba)
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];

    recurrences.forEach(async (rec) => {
        if (rec.active && rec.nextPaymentDate <= today) {
            // 1. Crear la transacción
            await addTransaction({
                type: rec.type,
                category: rec.category,
                description: `Recurrente: ${rec.name}`,
                grossAmount: rec.amount,
                netAmount: rec.amount,
                deductionPercentage: 0,
                color: '#8b5cf6', // Color por defecto para automáticos
                date: today
            });

            // 2. Calcular la próxima fecha
            const nextDate = new Date(rec.nextPaymentDate);
            if (rec.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
            if (rec.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
            if (rec.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);

            // 3. Actualizar la recurrencia
            await updateRecurrence(rec.id, {
                nextPaymentDate: nextDate.toISOString().split('T')[0]
            });
        }
    });
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