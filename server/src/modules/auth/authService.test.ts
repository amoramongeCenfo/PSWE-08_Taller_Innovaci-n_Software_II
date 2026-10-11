import { beforeEach, describe, expect, it } from 'vitest';
import type { HttpError } from '../../lib/httpError';
import { AuthService, REMEMBER_ME_TTL_MS, SESSION_TTL_MS } from './authService';
import { MemoryAuthRepository } from './memoryAuthRepository';

let repository: MemoryAuthRepository;
let now: Date;
let service: AuthService;

const ADMIN = { email: 'Ana@Colibri.cr', password: 'clave-segura-1' };

beforeEach(async () => {
  repository = new MemoryAuthRepository();
  now = new Date('2026-10-09T10:00:00.000Z');
  service = new AuthService(repository, () => now);
  await service.ensureInitialAdmin(ADMIN);
});

async function rejection(promise: Promise<unknown>): Promise<HttpError> {
  try {
    await promise;
  } catch (error) {
    return error as HttpError;
  }
  throw new Error('Se esperaba un error');
}

describe('cuenta inicial', () => {
  it('no hace nada si no se configuró', async () => {
    expect(await service.ensureInitialAdmin({ email: '', password: '' })).toBe('skipped');
  });

  it('exige correo y contraseña juntos y una contraseña de al menos 8 caracteres', async () => {
    await expect(service.ensureInitialAdmin({ email: 'a@b.cr', password: '' })).rejects.toThrow();
    await expect(
      service.ensureInitialAdmin({ email: 'a@b.cr', password: 'corta' }),
    ).rejects.toThrow('al menos 8');
  });

  it('no la duplica y actualiza la contraseña si cambió en el archivo', async () => {
    expect(await service.ensureInitialAdmin(ADMIN)).toBe('unchanged');

    const { token } = await service.login(ADMIN.email, ADMIN.password, false);
    const result = await service.ensureInitialAdmin({ ...ADMIN, password: 'otra-clave-nueva' });
    expect(result).toBe('password-updated');
    // Al cambiar la contraseña, las sesiones abiertas se cierran.
    expect(await service.getUser(token)).toBeNull();
    await expect(service.login(ADMIN.email, ADMIN.password, false)).rejects.toThrow();
    await expect(service.login(ADMIN.email, 'otra-clave-nueva', false)).resolves.toBeDefined();
  });
});

describe('inicio de sesión', () => {
  it('entra con las credenciales correctas, sin importar mayúsculas ni espacios en el correo', async () => {
    const result = await service.login('  ANA@colibri.cr ', ADMIN.password, false);
    expect(result.user.email).toBe('ana@colibri.cr');
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(result.token.length).toBeGreaterThan(30);
    expect(await service.getUser(result.token)).toMatchObject({ email: 'ana@colibri.cr' });
  });

  it('da el mismo error con una contraseña mala que con un correo que no existe', async () => {
    const wrongPassword = await rejection(service.login('ana@colibri.cr', 'mala-clave-1', false));
    const unknownEmail = await rejection(service.login('nadie@colibri.cr', ADMIN.password, false));
    expect(wrongPassword.status).toBe(401);
    expect(wrongPassword.code).toBe('INVALID_CREDENTIALS');
    expect(unknownEmail.code).toBe(wrongPassword.code);
    expect(unknownEmail.message).toBe(wrongPassword.message);
  });

  it('la sesión normal dura 12 horas y la de "mantener sesión" 30 días', async () => {
    const normal = await service.login(ADMIN.email, ADMIN.password, false);
    const remembered = await service.login(ADMIN.email, ADMIN.password, true);
    expect(normal.persistent).toBe(false);
    expect(normal.expiresAt.getTime() - now.getTime()).toBe(SESSION_TTL_MS);
    expect(remembered.persistent).toBe(true);
    expect(remembered.expiresAt.getTime() - now.getTime()).toBe(REMEMBER_ME_TTL_MS);
  });

  it('cada inicio de sesión genera un token distinto', async () => {
    const a = await service.login(ADMIN.email, ADMIN.password, false);
    const b = await service.login(ADMIN.email, ADMIN.password, false);
    expect(a.token).not.toBe(b.token);
  });

  it('guarda solo el hash del token, nunca el token', async () => {
    const { token } = await service.login(ADMIN.email, ADMIN.password, false);
    expect(await repository.findSession(token)).toBeNull();
  });
});

describe('sesión vigente', () => {
  it('vence con el tiempo y se borra', async () => {
    const { token } = await service.login(ADMIN.email, ADMIN.password, false);
    now = new Date(now.getTime() + SESSION_TTL_MS + 1);
    expect(await service.getUser(token)).toBeNull();
  });

  it('un token inventado o ausente no abre nada', async () => {
    expect(await service.getUser('inventado')).toBeNull();
    expect(await service.getUser(undefined)).toBeNull();
  });

  it('al cerrar sesión el token deja de servir', async () => {
    const { token } = await service.login(ADMIN.email, ADMIN.password, false);
    await service.logout(token);
    expect(await service.getUser(token)).toBeNull();
    await expect(service.logout(undefined)).resolves.toBeUndefined();
  });
});
