import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { clearSessionCookie, readCookie, setSessionCookie } from '../../lib/cookies';
import { HttpError } from '../../lib/httpError';
import type { AuthService } from './authService';
import { SESSION_COOKIE } from './sessionCookie';

const loginSchema = z.object({
  email: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(200),
  rememberMe: z.boolean().default(false),
});

export function createAuthRouter(auth: AuthService): Router {
  const router = Router();

  // Frena los intentos de adivinar contraseñas. Los inicios de sesión exitosos no cuentan.
  const loginLimiter = rateLimit({
    windowMs: 15 * 60_000,
    limit: 20,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => {
      res
        .status(429)
        .json({ code: 'TOO_MANY_ATTEMPTS', message: 'Demasiados intentos. Espera unos minutos.' });
    },
  });

  router.post('/login', loginLimiter, async (req, res) => {
    const body = loginSchema.safeParse(req.body);
    if (!body.success) {
      throw new HttpError(400, 'INVALID_REQUEST', 'Escribe tu correo y tu contraseña.');
    }
    const { email, password, rememberMe } = body.data;
    const result = await auth.login(email, password, rememberMe);
    setSessionCookie(req, res, SESSION_COOKIE, result.token, {
      expires: result.persistent ? result.expiresAt : undefined,
    });
    res.json({ user: result.user });
  });

  router.get('/me', async (req, res) => {
    const user = await auth.getUser(readCookie(req, SESSION_COOKIE));
    if (!user) throw new HttpError(401, 'UNAUTHENTICATED', 'No hay una sesión activa.');
    res.json({ user });
  });

  router.post('/logout', async (req, res) => {
    await auth.logout(readCookie(req, SESSION_COOKIE));
    clearSessionCookie(req, res, SESSION_COOKIE);
    res.status(204).end();
  });

  return router;
}
