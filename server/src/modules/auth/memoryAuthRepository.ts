import { randomUUID } from 'node:crypto';
import type { AuthRepository } from './authRepository';
import type {
  AuthUser,
  NewSession,
  NewUser,
  StoredSession,
  StoredUser,
  UserProfile,
} from './types';

function publicUser({ passwordHash: _hash, ...user }: StoredUser): AuthUser {
  return user;
}

/** Usuarios y sesiones en memoria: se pierden al reiniciar el servidor. */
export class MemoryAuthRepository implements AuthRepository {
  private readonly users = new Map<string, StoredUser>();
  private readonly sessions = new Map<string, NewSession>();

  async findUserByEmail(email: string) {
    const user = [...this.users.values()].find((candidate) => candidate.email === email);
    return user ? { ...user } : null;
  }

  async createUser(input: NewUser) {
    if ([...this.users.values()].some((user) => user.email === input.email)) {
      throw new Error(`El correo ${input.email} ya existe`);
    }
    const user: StoredUser = { id: randomUUID(), ...input };
    this.users.set(user.id, user);
    return publicUser(user);
  }

  async updatePasswordHash(userId: string, passwordHash: string) {
    const user = this.users.get(userId);
    if (user) user.passwordHash = passwordHash;
  }

  async updateUserProfile(userId: string, profile: UserProfile) {
    const user = this.users.get(userId);
    if (!user) throw new Error('Usuario no encontrado');
    user.name = profile.name;
    user.role = profile.role;
    return publicUser(user);
  }

  async createSession(session: NewSession) {
    this.sessions.set(session.tokenHash, { ...session });
  }

  async findSession(tokenHash: string): Promise<StoredSession | null> {
    const session = this.sessions.get(tokenHash);
    const user = session ? this.users.get(session.userId) : undefined;
    return session && user ? { user: publicUser(user), expiresAt: session.expiresAt } : null;
  }

  async deleteSession(tokenHash: string) {
    this.sessions.delete(tokenHash);
  }

  async deleteExpiredSessions(now: string) {
    let removed = 0;
    for (const [hash, session] of this.sessions) {
      if (session.expiresAt <= now) {
        this.sessions.delete(hash);
        removed += 1;
      }
    }
    return removed;
  }

  async deleteSessionsOfUser(userId: string) {
    for (const [hash, session] of this.sessions) {
      if (session.userId === userId) this.sessions.delete(hash);
    }
  }
}
