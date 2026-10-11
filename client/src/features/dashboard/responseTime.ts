/** Formatea segundos como tiempo de respuesta corto: "45 s", "1.8 min", "2.5 h", "1.2 días". */
export function formatResponseTime(seconds: number): string {
  const one = (value: number) => value.toFixed(1).replace(/\.0$/, '');
  if (seconds < 60) return `${Math.max(1, Math.round(seconds))} s`;
  if (seconds < 3600) return `${one(seconds / 60)} min`;
  if (seconds < 86_400) return `${one(seconds / 3600)} h`;
  return `${one(seconds / 86_400)} días`;
}

export type ResponseSpeed = 'rapida' | 'aceptable' | 'lenta';

/** Clasifica el tiempo: hasta 5 min es rápido, hasta 1 hora aceptable, más es lento. */
export function getResponseSpeed(seconds: number): ResponseSpeed {
  if (seconds <= 5 * 60) return 'rapida';
  if (seconds <= 60 * 60) return 'aceptable';
  return 'lenta';
}

/**
 * Qué tan llena va la barra (0 a 1): llena con respuestas en 1 minuto o menos y baja a medida
 * que el tiempo sube (escala logarítmica, para que 5 min y 1 h se distingan bien).
 */
export function getResponseBarRatio(seconds: number): number {
  if (seconds <= 60) return 1;
  const ratio = 1 - Math.log10(seconds / 60) / Math.log10(24 * 60);
  return Math.min(1, Math.max(0.06, ratio));
}
