// src/types/finance.ts

export interface Transaction {
  id: string;
  userId: string; // VITAL: Para saber de quién es esta transacción
  type: 'income' | 'expense';
  category: string;
  description: string;
  grossAmount: number; // Monto bruto
  deductionPercentage?: number; // Opcional, para impuestos/retenciones
  netAmount: number; // Lo que realmente entra/sale
  color: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly'; // Agregamos yearly
  startDate: string;
  endDate?: string;
  accumulatedDeficit?: number;
  icon?: string; // Para futuro uso visual
}

// NUEVA ESTRUCTURA PARA RECURRENCIAS
export interface Recurrence {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  name: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
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

// ... Mantén el resto de User, AuthState, PRESET_COLORS y DEFAULT_CATEGORIES igual
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