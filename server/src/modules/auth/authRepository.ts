import type {
  AuthUser,
  NewSession,
  NewUser,
  StoredSession,
  StoredUser,
  UserProfile,
} from './types';

/**
 * Contrato de almacenamiento de usuarios y sesiones. Igual que ConversationRepository, tiene una
 * versión en memoria y otra en PostgreSQL, y ambas pasan las mismas pruebas.
 */
export interface AuthRepository {
  /** Busca por correo ya normalizado (minúsculas, sin espacios). */
  findUserByEmail(email: string): Promise<StoredUser | null>;
  createUser(user: NewUser): Promise<AuthUser>;
  updatePasswordHash(userId: string, passwordHash: string): Promise<void>;
  /** Cambia el nombre y el puesto. Devuelve la persona ya actualizada. */
  updateUserProfile(userId: string, profile: UserProfile): Promise<AuthUser>;

  createSession(session: NewSession): Promise<void>;
  /** Devuelve la sesión y su usuario, o null si no existe (no revisa si venció). */
  findSession(tokenHash: string): Promise<StoredSession | null>;
  deleteSession(tokenHash: string): Promise<void>;
  /** Borra las sesiones vencidas y devuelve cuántas eran. */
  deleteExpiredSessions(now: string): Promise<number>;
  /** Cierra todas las sesiones de una persona (por ejemplo, al cambiar su contraseña). */
  deleteSessionsOfUser(userId: string): Promise<void>;
}
