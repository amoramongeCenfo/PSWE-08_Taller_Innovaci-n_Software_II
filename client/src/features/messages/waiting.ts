/** Cuánto lleva esperando: "5 min", "2 h", "3 días". Menos de un minuto cuenta como 1 min. */
export function formatWaiting(since: string, now: Date = new Date()): string {
  const minutes = Math.max(1, Math.floor((now.getTime() - Date.parse(since)) / 60_000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? '1 día' : `${days} días`;
}

/** Una espera de una hora o más se marca como urgente. */
export function isLongWait(since: string, now: Date = new Date()): boolean {
  return now.getTime() - Date.parse(since) >= 60 * 60_000;
}
