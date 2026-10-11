export const REPLY_WINDOW_MS = 24 * 60 * 60 * 1000;

const LOCALE = 'es-CR';
const clock = new Intl.DateTimeFormat(LOCALE, { hour: 'numeric', minute: '2-digit' });
const weekday = new Intl.DateTimeFormat(LOCALE, { weekday: 'short' });
const longDay = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long' });
const shortDate = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
});

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Días de calendario entre dos fechas (0 = el mismo día, 1 = ayer). */
export function daysBetween(date: Date, now: Date): number {
  return Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
}

/** WhatsApp, Instagram y Messenger solo permiten responder en las 24 horas siguientes al último mensaje de la persona. */
export function isReplyWindowOpen(lastInboundAt: string | null, now: Date = new Date()): boolean {
  if (!lastInboundAt) return false;
  return now.getTime() - Date.parse(lastInboundAt) <= REPLY_WINDOW_MS;
}

/** Hora del mensaje: "9:41 p. m.". */
export function formatClock(iso: string): string {
  return clock.format(new Date(iso));
}

/** Fecha corta para la lista: hora si es de hoy, "Ayer", día de la semana o fecha. */
export function formatListTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const days = daysBetween(date, now);
  if (days <= 0) return formatClock(iso);
  if (days === 1) return 'Ayer';
  if (days < 7) return weekday.format(date);
  return shortDate.format(date);
}

/** Separador de día dentro de una conversación: "Hoy", "Ayer" o "8 de octubre". */
export function formatDayLabel(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const days = daysBetween(date, now);
  if (days <= 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  return longDay.format(date);
}
