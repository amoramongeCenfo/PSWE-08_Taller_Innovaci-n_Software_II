import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keyLength: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const PREFIX = 'scrypt';

/** Largo mínimo exigido a las contraseñas que define el servidor. */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Convierte una contraseña en un texto seguro para guardar: `scrypt$sal$hash`.
 * Cada contraseña lleva su propia sal, así dos iguales no producen el mismo resultado.
 * Usa scrypt de Node (sin dependencias extra), diseñado para ser lento ante ataques de fuerza bruta.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const hash = await scrypt(password, salt, KEY_LENGTH);
  return [PREFIX, salt.toString('base64'), hash.toString('base64')].join('$');
}

/** ¿La contraseña coincide con el hash guardado? Compara en tiempo constante. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [prefix, saltText, hashText] = stored.split('$');
  if (prefix !== PREFIX || !saltText || !hashText) return false;

  const expected = Buffer.from(hashText, 'base64');
  const actual = await scrypt(password, Buffer.from(saltText, 'base64'), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
