import type { AuthUser } from '../modules/auth/types';

declare global {
  namespace Express {
    interface Request {
      /** Cuerpo sin modificar, necesario para validar la firma de Meta. */
      rawBody?: Buffer;
      /** Persona con sesión iniciada. Solo existe después de `requireAuth`. */
      user?: AuthUser;
    }
  }
}

export {};
