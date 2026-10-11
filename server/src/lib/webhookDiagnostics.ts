/**
 * Utilidades compartidas por los lectores de webhooks de Meta (Instagram y Messenger).
 * Para diagnosticar se imprimen solo NOMBRES de campos, nunca sus valores.
 */

/** Nombres de las claves (dos niveles) de un objeto, sin sus valores. */
export function describeKeys(value: unknown): string {
  if (typeof value !== 'object' || value === null) return typeof value;
  return Object.entries(value as Record<string, unknown>)
    .map(([key, inner]) =>
      typeof inner === 'object' && inner !== null && !Array.isArray(inner)
        ? `${key}{${Object.keys(inner).join(',')}}`
        : key,
    )
    .join(', ');
}

/** Meta envía marcas de tiempo en segundos o milisegundos, como número o texto. */
export function toIsoDate(timestamp: number | string | undefined): string {
  const value = Number(timestamp);
  if (!Number.isFinite(value) || value <= 0) return new Date().toISOString();
  return new Date(value < 1e11 ? value * 1000 : value).toISOString();
}

/** Explica por qué un cuerpo no tiene la forma esperada, solo con nombres de campos. */
export function explainShape(
  body: unknown,
  issues: { path: PropertyKey[]; message: string }[] | null,
): string {
  if (typeof body !== 'object' || body === null) return 'el cuerpo no es un objeto JSON';
  const object = (body as { object?: unknown }).object;
  const problems = issues
    ? issues.map((i) => `${i.path.map(String).join('.') || '(raíz)'}: ${i.message}`).join('; ')
    : 'sin problemas';
  return `object="${typeof object === 'string' ? object : typeof object}"; campos: ${Object.keys(body).join(', ')}; ${problems}`;
}
