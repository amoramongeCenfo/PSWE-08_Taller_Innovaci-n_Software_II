import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { isValidSignature } from './whatsapp.signature';

const secret = 'secreto-de-prueba';
const body = Buffer.from(JSON.stringify({ hola: 'mundo' }));
const sign = (data: Buffer, key = secret) =>
  `sha256=${createHmac('sha256', key).update(data).digest('hex')}`;

describe('isValidSignature', () => {
  it('acepta una firma correcta', () => {
    expect(isValidSignature(body, sign(body), secret)).toBe(true);
  });

  it('rechaza una firma hecha con otro secreto', () => {
    expect(isValidSignature(body, sign(body, 'otro'), secret)).toBe(false);
  });

  it('rechaza si el cuerpo fue modificado', () => {
    expect(isValidSignature(Buffer.from('{"hola":"mundo!"}'), sign(body), secret)).toBe(false);
  });

  it('rechaza si falta el encabezado, el cuerpo o el secreto', () => {
    expect(isValidSignature(body, undefined, secret)).toBe(false);
    expect(isValidSignature(undefined, sign(body), secret)).toBe(false);
    expect(isValidSignature(body, sign(body), '')).toBe(false);
  });

  it('rechaza formatos raros sin lanzar errores', () => {
    expect(isValidSignature(body, 'sha256=zzzz', secret)).toBe(false);
    expect(isValidSignature(body, 'sha256=', secret)).toBe(false);
    expect(isValidSignature(body, 'md5=abcd', secret)).toBe(false);
  });
});
