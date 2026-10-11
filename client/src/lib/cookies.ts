export interface CookieOptions {
  /** Vida de la cookie en segundos. Si se omite, es una cookie de sesión (se borra al cerrar el navegador). */
  maxAgeSeconds?: number;
  path?: string;
  sameSite?: 'Lax' | 'Strict' | 'None';
  /** Por defecto, solo se marca como Secure cuando la página se sirve por HTTPS. */
  secure?: boolean;
}

export function getCookie(name: string): string | null {
  const prefix = `${encodeURIComponent(name)}=`;
  for (const part of document.cookie.split('; ')) {
    if (part.startsWith(prefix)) {
      try {
        return decodeURIComponent(part.slice(prefix.length));
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  const { maxAgeSeconds, path = '/', sameSite = 'Lax', secure } = options;
  const attributes = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    `Path=${path}`,
    `SameSite=${sameSite}`,
  ];
  if (maxAgeSeconds !== undefined) attributes.push(`Max-Age=${Math.floor(maxAgeSeconds)}`);
  if (secure ?? window.location.protocol === 'https:') attributes.push('Secure');
  document.cookie = attributes.join('; ');
}

export function deleteCookie(name: string, path = '/'): void {
  document.cookie = `${encodeURIComponent(name)}=; Path=${path}; Max-Age=0; SameSite=Lax`;
}
