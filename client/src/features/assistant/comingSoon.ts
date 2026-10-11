/** Enlace a la pantalla "Próximamente" para funciones que todavía no existen. */
export function comingSoonPath(feature: string): string {
  return `/proximamente?funcion=${encodeURIComponent(feature)}`;
}
