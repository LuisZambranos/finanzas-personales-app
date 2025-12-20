// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// 1. Estilos (Tailwind) - NO BORRAR
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 2. Soluciona que al abrir el formulario la fecha sea ayer
export function getLocalDateISOString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 3. Soluciona los cálculos de Metas (evita conversión UTC)
export function parseLocalDate(dateString: string): Date {
  if (!dateString) return new Date();
  const [year, month, day] = dateString.split('-').map(Number);
  // Ponemos hora 12:00 para blindar contra cambios de horario
  return new Date(year, month - 1, day, 12, 0, 0);
}

// 4. Soluciona que en el Historial se vea un día menos
export function formatLocalDate(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0);
  
  return date.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}