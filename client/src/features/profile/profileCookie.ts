import { deleteCookie, getCookie, setCookie } from '../../lib/cookies';
import type { ProfileData } from './types';

/**
 * Cookie del perfil del SERVICIO SIMULADO: único lugar que lee y escribe estos datos en el
 * navegador. Cuando exista el backend, este archivo deja de usarse.
 *
 * Una cookie escrita desde JavaScript no puede ser HttpOnly ni guardar mucho (límite ~4 KB):
 * sirve solo para desarrollar. Los límites de largo del formulario mantienen el dato pequeño.
 */
const COOKIE_NAME = 'colibri_profile';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function isText(value: unknown): value is string {
  return typeof value === 'string';
}

function isProfileData(value: unknown): value is ProfileData {
  if (typeof value !== 'object' || value === null) return false;
  const { user, business } = value as Partial<ProfileData>;
  return (
    typeof user === 'object' &&
    user !== null &&
    isText(user.name) &&
    isText(user.role) &&
    typeof business === 'object' &&
    business !== null &&
    isText(business.name) &&
    (business.address === null || isText(business.address))
  );
}

export function readProfileCookie(): ProfileData | null {
  const raw = getCookie(COOKIE_NAME);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isProfileData(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeProfileCookie(data: ProfileData): void {
  setCookie(COOKIE_NAME, JSON.stringify(data), { maxAgeSeconds: ONE_YEAR_SECONDS });
}

export function clearProfileCookie(): void {
  deleteCookie(COOKIE_NAME);
}
