import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('contraseñas', () => {
  it('acepta la contraseña correcta y rechaza otra', async () => {
    const hash = await hashPassword('clave-segura-1');
    expect(await verifyPassword('clave-segura-1', hash)).toBe(true);
    expect(await verifyPassword('clave-segura-2', hash)).toBe(false);
  });

  it('no guarda la contraseña en claro y usa una sal distinta cada vez', async () => {
    const a = await hashPassword('misma-clave-1');
    const b = await hashPassword('misma-clave-1');
    expect(a).not.toContain('misma-clave-1');
    expect(a).not.toBe(b);
  });

  it('rechaza un hash con formato desconocido', async () => {
    expect(await verifyPassword('x', 'texto-cualquiera')).toBe(false);
    expect(await verifyPassword('x', 'md5$a$b')).toBe(false);
  });
});
