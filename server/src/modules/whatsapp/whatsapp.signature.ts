import { createHmac, timingSafeEqual } from 'node:crypto';

const PREFIX = 'sha256=';

/**
 * Comprueba que el mensaje lo envió Meta. Meta firma el cuerpo SIN modificar con el secreto de
 * la app (HMAC-SHA256) y manda el resultado en el encabezado `X-Hub-Signature-256`.
 */
export function isValidSignature(
  rawBody: Buffer | undefined,
  header: string | undefined,
  appSecret: string,
): boolean {
  if (!rawBody || !header?.startsWith(PREFIX) || !appSecret) return false;

  const received = Buffer.from(header.slice(PREFIX.length), 'hex');
  const expected = createHmac('sha256', appSecret).update(rawBody).digest();

  // timingSafeEqual exige el mismo largo; comparar a tiempo constante evita ataques por tiempo.
  return received.length === expected.length && timingSafeEqual(received, expected);
}
