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
  frequency: Frequency;
  isRecurringRule?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  offDays?: string[];
  accumulatedDeficit?: number; // Para compatibilidad
  type?: 'savings' | 'debt'; // Si no tiene, asumimos 'savings'
  linkedCategory?: string;   // La categoría de gasto que sumará a esta deuda
  totalInstallments?: number; // Número de cuotas
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
"#10B981", // 1. Verde Esmeralda (Tu original predeterminado)
  "#3B82F6", // 2. Azul original
  "#8B5CF6", // 3. Morado original
  "#F59E0B", // 4. Naranja / Ámbar original
  "#EF4444", // 5. Rojo original
  "#EC4899", // 6. Rosa / Fucsia original
  "#06B6D4", // 7. Cyan / Celeste original
  "#FFD700", // 8. Amarillo Oro (Nuevo, resalta mucho)
  "#39FF14", // 9. Verde Neón (Para que no se confunda con el esmeralda)
  "#8A2BE2", // 10. Violeta eléctrico intenso (Contrasta con el morado)
  "#D2691E", // 11. Tono tierra / Chocolate (Excelente para "Casa" o "Gastos fijos")
  "#B0C4DE", // 12. Azul acero / Gris plata (Excelente para "Otros")
];

export const DEFAULT_CATEGORIES = {
  income: ['Salario', 'Freelance', 'Inversiones', 'Otros'],
  expense: ['Comida', 'Transporte', 'Entretenimiento', 'Servicios', 'Salud', 'Educación', 'Otros'],
};