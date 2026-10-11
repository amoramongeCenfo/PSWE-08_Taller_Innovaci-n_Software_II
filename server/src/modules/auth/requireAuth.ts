import type { RequestHandler } from 'express';
import { HttpError } from '../../lib/httpError';
import { readCookie } from '../../lib/cookies';
import type { AuthService } from './authService';
import { SESSION_COOKIE } from './sessionCookie';

/** Deja pasar solo a quien tiene una sesión vigente; si no, responde 401. */
export function requireAuth(auth: AuthService): RequestHandler {
  return async (req, _res, next) => {
    const user = await auth.getUser(readCookie(req, SESSION_COOKIE));
    if (!user) throw new HttpError(401, 'UNAUTHENTICATED', 'Inicia sesión para continuar.');
    req.user = user;
    next();
  };
}
