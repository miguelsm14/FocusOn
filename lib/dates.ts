import { addDays, format, parseISO } from 'date-fns';

/** Fecha local 'YYYY-MM-DD' (nunca usar toISOString: va en UTC). */
export function toISODate(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDaysISO(iso: string, days: number): string {
  return toISODate(addDays(parseISO(iso), days));
}

/** Día local en el que ocurrió un timestamp ISO (p. ej. completed_at). */
export function localDateOf(timestamp: string | null): string | null {
  if (!timestamp) return null;
  const d = new Date(timestamp);
  return isNaN(d.getTime()) ? null : toISODate(d);
}
