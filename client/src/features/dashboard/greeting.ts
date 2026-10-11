/** Saludo según la hora del día. */
export function getGreeting(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/** Primer nombre de una persona, o null si no hay nombre. */
export function getFirstName(fullName: string | null): string | null {
  return fullName?.trim().split(/\s+/)[0] || null;
}

/** Fecha corta en español, por ejemplo "Hoy, 8 de octubre". */
export function formatToday(date: Date): string {
  const text = new Intl.DateTimeFormat('es-CR', { day: 'numeric', month: 'long' }).format(date);
  return `Hoy, ${text}`;
}

/** Une una lista en español: "WhatsApp, Instagram y Facebook". */
export function formatList(items: readonly string[]): string {
  return new Intl.ListFormat('es', { style: 'long', type: 'conjunction' }).format(items);
}
