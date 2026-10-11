/** Texto que se muestra cuando un dato todavía no está disponible. */
export const NOT_AVAILABLE = 'N/A';

/** Devuelve el texto o "N/A" si el valor no existe o está vacío. */
export function orNotAvailable(value: string | null | undefined): string {
  const text = value?.trim();
  return text ? text : NOT_AVAILABLE;
}

/** Une una lista con comas o devuelve "N/A" si está vacía. */
export function listOrNotAvailable(values: readonly string[] | null | undefined): string {
  const items = (values ?? []).map((item) => item.trim()).filter(Boolean);
  return items.length > 0 ? items.join(', ') : NOT_AVAILABLE;
}

/** Iniciales (hasta dos letras) de un nombre, o "" si no hay nombre. */
export function getInitials(name: string | null | undefined): string {
  return (name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}
