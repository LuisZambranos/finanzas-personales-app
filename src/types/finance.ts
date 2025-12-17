// src/types/finance.ts

// NUEVO: Definimos los tipos de frecuencia disponibles globalmente
export type Frequency = 'one-time' | 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'yearly';

export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  grossAmount: number;
  deductionPercentage?: number;
  netAmount: number;
  color: string;
  date: string;
  
  // NUEVO: Campos para manejo de tiempo y recurrencia
  frequency: Frequency; // Vital para calcular si cumples metas diarias con sueldo mensual
  isRecurringRule?: boolean; // Flag para saber si esta transacción generó una regla a futuro

  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  
  // NUEVO: Fechas para controlar la vigencia de la meta
  startDate: string;
  endDate?: string;
  
  accumulatedDeficit?: number;
  icon?: string;
}

export interface Recurrence {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  name: string;
  amount: number; // Monto base
  
  // Usamos el tipo Frequency para consistencia
  frequency: Frequency; 
  nextPaymentDate: string;
  active: boolean;
  
  category: string;
  description?: string;
  createdAt: string;
}

export interface CategoryColor {
  category: string;
  color: string;
  count: number;
}

export interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  savingsRate: number;
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const PRESET_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', 
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

export const DEFAULT_CATEGORIES = {
  income: ['Salario', 'Freelance', 'Inversiones', 'Otros'],
  expense: ['Comida', 'Transporte', 'Entretenimiento', 'Servicios', 'Salud', 'Educación', 'Otros'],
};