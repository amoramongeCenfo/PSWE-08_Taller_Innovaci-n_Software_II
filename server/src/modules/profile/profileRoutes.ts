import { Router } from 'express';
import { z } from 'zod';
import { HttpError } from '../../lib/httpError';
import type { ProfileService } from './profileService';

// Mismos límites que el formulario del cliente (features/profile/validation.ts).
const text = (max: number) => z.string().trim().min(1).max(max);

const profileSchema = z.object({
  user: z.object({ name: text(80), role: text(60) }),
  business: z.object({
    name: text(80),
    address: z
      .string()
      .trim()
      .max(200)
      .nullable()
      .transform((value) => value || null),
  }),
});

/** GET /api/business: datos del negocio. */
export function createBusinessRouter(profile: ProfileService): Router {
  const router = Router();
  router.get('/', async (_req, res) => {
    res.json(await profile.getBusiness());
  });
  return router;
}

/** PUT /api/profile: guarda la persona y el negocio, y devuelve los datos ya guardados. */
export function createProfileRouter(profile: ProfileService): Router {
  const router = Router();
  router.put('/', async (req, res) => {
    const body = profileSchema.safeParse(req.body);
    if (!body.success) {
      throw new HttpError(400, 'INVALID_REQUEST', 'Revisa los datos del perfil.');
    }
    if (!req.user) throw new HttpError(401, 'UNAUTHENTICATED', 'Inicia sesión para continuar.');
    res.json(await profile.save(req.user.id, body.data));
  });
  return router;
}
