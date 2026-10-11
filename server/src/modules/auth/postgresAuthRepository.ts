import type { Pool } from 'pg';
import type { AuthRepository } from './authRepository';
import type {
  AuthUser,
  NewSession,
  NewUser,
  StoredSession,
  StoredUser,
  UserProfile,
} from './types';

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: string | null;
  password_hash: string;
}

const toUser = (row: UserRow): AuthUser => ({
  id: row.id,
  email: row.email,
  name: row.name,
  role: row.role,
});

/** Usuarios y sesiones en PostgreSQL. Las tablas se crean con las migraciones. */
export class PostgresAuthRepository implements AuthRepository {
  constructor(private readonly pool: Pool) {}

  async findUserByEmail(email: string): Promise<StoredUser | null> {
    const { rows } = await this.pool.query<UserRow>(
      'SELECT id, email, name, role, password_hash FROM users WHERE email = $1',
      [email],
    );
    return rows[0] ? { ...toUser(rows[0]), passwordHash: rows[0].password_hash } : null;
  }

  async createUser(user: NewUser) {
    const { rows } = await this.pool.query<UserRow>(
      `INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role, password_hash`,
      [user.email, user.passwordHash, user.name, user.role],
    );
    return toUser(rows[0] as UserRow);
  }

  async updatePasswordHash(userId: string, passwordHash: string) {
    await this.pool.query('UPDATE users SET password_hash = $2 WHERE id = $1', [
      userId,
      passwordHash,
    ]);
  }

  async updateUserProfile(userId: string, profile: UserProfile) {
    const { rows } = await this.pool.query<UserRow>(
      `UPDATE users SET name = $2, role = $3 WHERE id = $1
       RETURNING id, email, name, role, password_hash`,
      [userId, profile.name, profile.role],
    );
    if (!rows[0]) throw new Error('Usuario no encontrado');
    return toUser(rows[0]);
  }

  async createSession(session: NewSession) {
    await this.pool.query(
      'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
      [session.tokenHash, session.userId, session.expiresAt],
    );
  }

  async findSession(tokenHash: string): Promise<StoredSession | null> {
    const { rows } = await this.pool.query<UserRow & { expires_at: Date }>(
      `SELECT u.id, u.email, u.name, u.role, u.password_hash, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1`,
      [tokenHash],
    );
    const row = rows[0];
    return row ? { user: toUser(row), expiresAt: row.expires_at.toISOString() } : null;
  }

  async deleteSession(tokenHash: string) {
    await this.pool.query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash]);
  }

  async deleteExpiredSessions(now: string) {
    const result = await this.pool.query('DELETE FROM sessions WHERE expires_at <= $1', [now]);
    return result.rowCount ?? 0;
  }

  async deleteSessionsOfUser(userId: string) {
    await this.pool.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
  }
}
