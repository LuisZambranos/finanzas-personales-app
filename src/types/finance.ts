export type Frequency = 'one-time' | 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'yearly';

export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  grossAmount: number;
  deductionPercentage: number;
  netAmount: number;
  color: string;
  date: string;
  frequency: Frequency; // Nuevo: Para saber si este dinero es para el día o para el mes
  isRecurringRule?: boolean; // Flag para saber si se creó desde una regla
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
  startDate: string; // Nuevo
  endDate?: string;  // Nuevo
  accumulatedDeficit?: number;
}

export interface Recurrence {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  frequency: Frequency;
  nextPaymentDate: string;
  active: boolean;
  createdAt: string;
}

export interface CategoryColor {
  category: string;
  color: string;
  count: number;
}

// ... User, AuthState, etc (mantener igual)
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