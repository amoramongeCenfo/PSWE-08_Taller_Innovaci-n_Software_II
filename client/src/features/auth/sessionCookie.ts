import { deleteCookie, getCookie, setCookie } from '../../lib/cookies';

/**
 * Cookie de sesión del SERVICIO SIMULADO.
 *
 * Importante: una cookie escrita desde JavaScript no puede ser HttpOnly, así que cualquier script
 * de la página puede leerla. Sirve para desarrollar sin backend. Con el backend real, la cookie
 * debe emitirla el servidor (HttpOnly) y este archivo deja de usarse.
 */
const COOKIE_NAME = 'colibri_session';
const REMEMBER_ME_SECONDS = 60 * 60 * 24 * 30; // 30 días

/**
 * Solo se guarda un token: los datos del usuario NO viajan en la cookie, así que nunca quedan
 * desactualizados. Quien lee la sesión (el servicio) es quien entrega los datos del usuario.
 */
export interface StoredSession {
  token: string;
}

function isStoredSession(value: unknown): value is StoredSession {
  if (typeof value !== 'object' || value === null) return false;
  const { token } = value as Partial<StoredSession>;
  return typeof token === 'string' && token.length > 0;
}

export function readSessionCookie(): StoredSession | null {
  const raw = getCookie(COOKIE_NAME);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isStoredSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Guarda la sesión. Con `persistent` la cookie dura 30 días; sin él, es una cookie de sesión
 * y desaparece al cerrar el navegador.
 */
export function writeSessionCookie(session: StoredSession, persistent: boolean): void {
  setCookie(COOKIE_NAME, JSON.stringify(session), {
    maxAgeSeconds: persistent ? REMEMBER_ME_SECONDS : undefined,
  });
}

export function clearSessionCookie(): void {
  deleteCookie(COOKIE_NAME);
}
