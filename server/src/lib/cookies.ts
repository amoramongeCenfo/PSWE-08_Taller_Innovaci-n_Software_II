import type { Request, Response } from 'express';

/** Valor de una cookie de la petición, o undefined. (Evita depender de cookie-parser.) */
export function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return undefined;
    }
  }
  return undefined;
}

interface SessionCookieOptions {
  /** Fecha de vencimiento. Sin ella, la cookie es "de sesión" y se borra al cerrar el navegador. */
  expires?: Date;
}

/**
 * Cookie de sesión: HttpOnly (JavaScript no puede leerla, así un script malicioso no la roba),
 * SameSite=Lax (no viaja en peticiones enviadas desde otros sitios) y Secure cuando la conexión
 * es https (por ejemplo, a través de un túnel).
 */
export function setSessionCookie(
  req: Request,
  res: Response,
  name: string,
  value: string,
  { expires }: SessionCookieOptions = {},
): void {
  res.cookie(name, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.secure,
    path: '/',
    ...(expires ? { expires } : undefined),
  });
}

export function clearSessionCookie(req: Request, res: Response, name: string): void {
  res.clearCookie(name, { httpOnly: true, sameSite: 'lax', secure: req.secure, path: '/' });
}
