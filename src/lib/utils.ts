// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD (zona horaria local)
 * @returns string - Fecha en formato ISO local (sin conversión UTC)
 */
export function getLocalDateISOString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convierte un string YYYY-MM-DD a objeto Date SIN conversión de zona horaria
 * @param dateString - Fecha en formato YYYY-MM-DD
 * @returns Date - Objeto Date en zona horaria local (mediodía para evitar cambios de día)
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  // Usamos mediodía (12:00) para evitar problemas de zona horaria
  return new Date(year, month - 1, day, 12, 0, 0);
}

/**
 * Formatea una fecha string YYYY-MM-DD a formato legible local
 * @param dateString - Fecha en formato YYYY-MM-DD
 * @returns string - Fecha formateada según locale
 */
export function formatLocalDate(dateString: string): string {
  const date = parseLocalDate(dateString);
  return date.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Obtiene el inicio del día actual (00:00:00 local)
 */
export function getStartOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Compara si dos fechas YYYY-MM-DD son el mismo día
 */
export function isSameDay(dateString1: string, dateString2: string): boolean {
  return dateString1 === dateString2;
}