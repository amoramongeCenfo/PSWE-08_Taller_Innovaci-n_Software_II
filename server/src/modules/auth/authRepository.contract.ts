import { beforeEach, describe, expect, it } from 'vitest';
import type { AuthRepository } from './authRepository';

/** Pruebas que TODA implementación de AuthRepository debe pasar. */
export function describeAuthRepository(name: string, create: () => Promise<AuthRepository>): void {
  describe(name, () => {
    let repo: AuthRepository;

    beforeEach(async () => {
      repo = await create();
    });

    const newUser = (email = 'ana@colibri.cr') => ({
      email,
      passwordHash: 'hash-1',
      name: null,
      role: null,
    });

    it('crea un usuario y lo encuentra por correo, con su hash', async () => {
      const created = await repo.createUser(newUser());
      expect(created).toMatchObject({ email: 'ana@colibri.cr', name: null, role: null });
      expect(created).not.toHaveProperty('passwordHash');

      const found = await repo.findUserByEmail('ana@colibri.cr');
      expect(found?.id).toBe(created.id);
      expect(found?.passwordHash).toBe('hash-1');
      expect(await repo.findUserByEmail('otra@colibri.cr')).toBeNull();
    });

    it('no permite dos usuarios con el mismo correo', async () => {
      await repo.createUser(newUser());
      await expect(repo.createUser(newUser())).rejects.toThrow();
    });

    it('cambia el hash de la contraseña', async () => {
      const user = await repo.createUser(newUser());
      await repo.updatePasswordHash(user.id, 'hash-2');
      expect((await repo.findUserByEmail('ana@colibri.cr'))?.passwordHash).toBe('hash-2');
    });

    it('actualiza el nombre y el puesto sin tocar lo demás', async () => {
      const user = await repo.createUser(newUser());
      const updated = await repo.updateUserProfile(user.id, { name: 'Ana Mora', role: 'Gerente' });
      expect(updated).toMatchObject({
        id: user.id,
        email: 'ana@colibri.cr',
        name: 'Ana Mora',
        role: 'Gerente',
      });
      expect(updated).not.toHaveProperty('passwordHash');
      const found = await repo.findUserByEmail('ana@colibri.cr');
      expect(found).toMatchObject({ name: 'Ana Mora', role: 'Gerente', passwordHash: 'hash-1' });
      await expect(repo.updateUserProfile('no-existe', { name: 'x', role: 'y' })).rejects.toThrow();
    });

    it('guarda una sesión, la encuentra con su usuario y la borra', async () => {
      const user = await repo.createUser(newUser());
      await repo.createSession({
        tokenHash: 'abc',
        userId: user.id,
        expiresAt: '2026-10-10T10:00:00.000Z',
      });

      const session = await repo.findSession('abc');
      expect(session?.user.id).toBe(user.id);
      expect(session?.user).not.toHaveProperty('passwordHash');
      expect(session?.expiresAt).toBe('2026-10-10T10:00:00.000Z');
      expect(await repo.findSession('otra')).toBeNull();

      await repo.deleteSession('abc');
      expect(await repo.findSession('abc')).toBeNull();
    });

    it('borra solo las sesiones vencidas', async () => {
      const user = await repo.createUser(newUser());
      await repo.createSession({
        tokenHash: 'viejo',
        userId: user.id,
        expiresAt: '2026-10-01T00:00:00.000Z',
      });
      await repo.createSession({
        tokenHash: 'vigente',
        userId: user.id,
        expiresAt: '2026-10-20T00:00:00.000Z',
      });

      expect(await repo.deleteExpiredSessions('2026-10-09T00:00:00.000Z')).toBe(1);
      expect(await repo.findSession('viejo')).toBeNull();
      expect(await repo.findSession('vigente')).not.toBeNull();
    });

    it('cierra todas las sesiones de una persona sin tocar las de otra', async () => {
      const ana = await repo.createUser(newUser());
      const luis = await repo.createUser(newUser('luis@colibri.cr'));
      const expiresAt = '2026-10-20T00:00:00.000Z';
      await repo.createSession({ tokenHash: 'a1', userId: ana.id, expiresAt });
      await repo.createSession({ tokenHash: 'a2', userId: ana.id, expiresAt });
      await repo.createSession({ tokenHash: 'l1', userId: luis.id, expiresAt });

      await repo.deleteSessionsOfUser(ana.id);
      expect(await repo.findSession('a1')).toBeNull();
      expect(await repo.findSession('a2')).toBeNull();
      expect(await repo.findSession('l1')).not.toBeNull();
    });
  });
}
