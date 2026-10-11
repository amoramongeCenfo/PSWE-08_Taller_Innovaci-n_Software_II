import { createHash, randomBytes } from 'node:crypto';
import { HttpError } from '../../lib/httpError';
import type { AuthRepository } from './authRepository';
import { hashPassword, MIN_PASSWORD_LENGTH, verifyPassword } from './password';
import type { AuthUser } from './types';

const HOUR_MS = 60 * 60 * 1000;
/** "Mantener sesión iniciada": 30 días. */
export const REMEMBER_ME_TTL_MS = 30 * 24 * HOUR_MS;
/** Sesión normal: la cookie muere al cerrar el navegador y, por si acaso, el servidor la vence en 12 horas. */
export const SESSION_TTL_MS = 12 * HOUR_MS;

export interface LoginResult {
  /** Valor para la cookie. El servidor solo guarda su hash. */
  token: string;
  user: AuthUser;
  /** Si es true, la cookie debe durar (Max-Age); si no, es de sesión. */
  persistent: boolean;
  expiresAt: Date;
}

export interface InitialAdmin {
  email: string;
  password: string;
}

export type SeedResult = 'skipped' | 'created' | 'password-updated' | 'unchanged';

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
const normalizeEmail = (email: string) => email.trim().toLowerCase();

function invalidCredentials(): HttpError {
  // Mensaje único: no revela si el correo existe.
  return new HttpError(401, 'INVALID_CREDENTIALS', 'El correo o la contraseña no son correctos.');
}

export class AuthService {
  /** Hash de relleno: así, aunque el correo no exista, el login tarda lo mismo que uno real. */
  private dummyHash: Promise<string> | undefined;

  constructor(
    private readonly repository: AuthRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async login(email: string, password: string, rememberMe: boolean): Promise<LoginResult> {
    const user = await this.repository.findUserByEmail(normalizeEmail(email));
    const hash = user?.passwordHash ?? (await this.getDummyHash());
    const valid = await verifyPassword(password, hash);
    if (!user || !valid) throw invalidCredentials();

    const now = this.now();
    await this.repository.deleteExpiredSessions(now.toISOString());

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(now.getTime() + (rememberMe ? REMEMBER_ME_TTL_MS : SESSION_TTL_MS));
    await this.repository.createSession({
      tokenHash: hashToken(token),
      userId: user.id,
      expiresAt: expiresAt.toISOString(),
    });

    const publicUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    return { token, user: publicUser, persistent: rememberMe, expiresAt };
  }

  /** La persona dueña de esa sesión, o null si el token no existe o ya venció. */
  async getUser(token: string | undefined): Promise<AuthUser | null> {
    if (!token) return null;
    const tokenHash = hashToken(token);
    const session = await this.repository.findSession(tokenHash);
    if (!session) return null;
    if (Date.parse(session.expiresAt) <= this.now().getTime()) {
      await this.repository.deleteSession(tokenHash);
      return null;
    }
    return session.user;
  }

  async logout(token: string | undefined): Promise<void> {
    if (token) await this.repository.deleteSession(hashToken(token));
  }

  /**
   * Garantiza que exista la cuenta inicial definida en `server/.env`. Si ya existe pero la
   * contraseña del archivo cambió, la actualiza y cierra sus sesiones: el archivo manda.
   */
  async ensureInitialAdmin(admin: InitialAdmin): Promise<SeedResult> {
    const email = normalizeEmail(admin.email);
    if (!email && !admin.password) return 'skipped';
    if (!email || !admin.password) {
      throw new Error('Define AUTH_ADMIN_EMAIL y AUTH_ADMIN_PASSWORD juntos en server/.env');
    }
    if (admin.password.length < MIN_PASSWORD_LENGTH) {
      throw new Error(`AUTH_ADMIN_PASSWORD debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);
    }

    const existing = await this.repository.findUserByEmail(email);
    if (!existing) {
      await this.repository.createUser({
        email,
        passwordHash: await hashPassword(admin.password),
        name: null,
        role: null,
      });
      return 'created';
    }
    if (await verifyPassword(admin.password, existing.passwordHash)) return 'unchanged';

    await this.repository.updatePasswordHash(existing.id, await hashPassword(admin.password));
    await this.repository.deleteSessionsOfUser(existing.id);
    return 'password-updated';
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= hashPassword('contraseña-de-relleno');
    return this.dummyHash;
  }
}
