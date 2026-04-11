import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
}

export function useFixedExpenses() {
  const { user } = useAuth(); // Traemos al usuario logueado
  
  // Inicializamos vacíos, Firebase se encargará de llenarlos
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [workingDays, setWorkingDaysState] = useState<number>(30);

  // 1. ESCUCHAR A LA BASE DE DATOS EN TIEMPO REAL
  useEffect(() => {
    if (!user?.id) {
      setFixedExpenses([]);
      setWorkingDaysState(30);
      return;
    }

    const userDocRef = doc(db, 'users', user.id);
    
    // onSnapshot escucha los cambios al instante (como el WhatsApp)
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Si hay datos en la BD, los ponemos en pantalla
        if (data.fixedExpenses) setFixedExpenses(data.fixedExpenses);
        if (data.workingDays) setWorkingDaysState(data.workingDays);
      }
    });

    return () => unsubscribe();
  }, [user?.id]);

  // 2. AGREGAR GASTO FIJO
  const addFixedExpense = async (name: string, amount: number) => {
    if (!user?.id) return;
    
    const newExpense: FixedExpense = { id: crypto.randomUUID(), name, amount };
    const updatedExpenses = [...fixedExpenses, newExpense];
    
    // Guardamos en Firebase (la pantalla se actualizará sola gracias al onSnapshot)
    const userDocRef = doc(db, 'users', user.id);
    await updateDoc(userDocRef, { fixedExpenses: updatedExpenses });
  };

  // 3. ELIMINAR GASTO FIJO
  const removeFixedExpense = async (id: string) => {
    if (!user?.id) return;
    
    const updatedExpenses = fixedExpenses.filter(e => e.id !== id);
    const userDocRef = doc(db, 'users', user.id);
    await updateDoc(userDocRef, { fixedExpenses: updatedExpenses });
  };

  // 4. ACTUALIZAR DÍAS HÁBILES
  const setWorkingDays = async (days: number) => {
    if (!user?.id) return;
    
    const userDocRef = doc(db, 'users', user.id);
    await updateDoc(userDocRef, { workingDays: days });
  };

  const totalFixedExpenses = fixedExpenses.reduce((sum, e) => sum + e.amount, 0);

  return { 
    fixedExpenses, 
    addFixedExpense, 
    removeFixedExpense, 
    totalFixedExpenses, 
    workingDays, 
    setWorkingDays 
  };
}