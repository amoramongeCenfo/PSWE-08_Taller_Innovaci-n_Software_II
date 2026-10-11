import { describe, expect, it, vi } from 'vitest';
import type { InstagramConfig } from '../../config';
import { createInstagramClient, createInstagramProfileLookup } from './instagram.client';

const config: InstagramConfig = {
  verifyToken: 'v',
  appSecret: 's',
  accessToken: 'token-secreto',
  accountId: '999',
  graphApiVersion: 'v23.0',
  simulate: false,
  debugWebhook: false,
};
const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

describe('createInstagramClient', () => {
  it('envía el texto con el token y devuelve el id', async () => {
    const fetchMock = vi.fn().mockResolvedValue(reply(200, { message_id: 'mid.out' }));
    const result = await createInstagramClient(config, fetchMock).sendText('igsid', 'Hola');

    expect(result).toEqual({ externalId: 'mid.out' });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://graph.instagram.com/v23.0/999/messages');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer token-secreto');
    expect(JSON.parse(init.body as string)).toEqual({
      recipient: { id: 'igsid' },
      message: { text: 'Hola' },
    });
  });

  it('detecta la ventana de 24 horas vencida', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(reply(400, { error: { code: 10, error_subcode: 2534022 } }));
    await expect(
      createInstagramClient(config, fetchMock).sendText('igsid', 'Hola'),
    ).rejects.toMatchObject({ reason: 'WINDOW_EXPIRED' });
  });

  it('falla con FAILED ante otros errores o si no hay respuesta', async () => {
    const rejected = vi.fn().mockResolvedValue(reply(500, { error: { code: 1 } }));
    await expect(
      createInstagramClient(config, rejected).sendText('igsid', 'Hola'),
    ).rejects.toMatchObject({ reason: 'FAILED' });
    const down = vi.fn().mockRejectedValue(new Error('red'));
    await expect(
      createInstagramClient(config, down).sendText('igsid', 'Hola'),
    ).rejects.toMatchObject({ reason: 'FAILED' });
  });

  it('falla con NOT_CONFIGURED sin token y no llama a la red', async () => {
    const fetchMock = vi.fn();
    const client = createInstagramClient({ ...config, accessToken: '' }, fetchMock);
    await expect(client.sendText('igsid', 'Hola')).rejects.toMatchObject({
      reason: 'NOT_CONFIGURED',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('modo simulado', () => {
  const simulated = { ...config, accessToken: '', accountId: '', simulate: true };

  it('"envía" sin llamar a Meta y devuelve un id propio', async () => {
    const fetchMock = vi.fn();
    const result = await createInstagramClient(simulated, fetchMock).sendText('sim:Ana', 'Hola');
    expect(result.externalId).toMatch(/^sim\./);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('muestra el nombre de los contactos "sim:Nombre"', async () => {
    const fetchMock = vi.fn();
    const lookup = createInstagramProfileLookup(simulated, fetchMock);
    expect(await lookup('sim:Ana Mora')).toBe('Ana Mora');
    expect(await lookup('sim:')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sin simulación, "sim:" no se trata distinto', async () => {
    const failing = vi.fn().mockResolvedValue(reply(400, {}));
    expect(await createInstagramProfileLookup(config, failing)('sim:Ana')).toBeNull();
  });
});

describe('createInstagramProfileLookup', () => {
  it('devuelve el nombre, o el @usuario si no hay nombre', async () => {
    const named = vi.fn().mockResolvedValue(reply(200, { name: 'Ana Mora', username: 'ana' }));
    expect(await createInstagramProfileLookup(config, named)('u1')).toBe('Ana Mora');
    const userOnly = vi.fn().mockResolvedValue(reply(200, { username: 'ana' }));
    expect(await createInstagramProfileLookup(config, userOnly)('u1')).toBe('@ana');
  });

  it('devuelve null si falla o no hay token', async () => {
    const failing = vi.fn().mockResolvedValue(reply(400, {}));
    expect(await createInstagramProfileLookup(config, failing)('u1')).toBeNull();
    const down = vi.fn().mockRejectedValue(new Error('red'));
    expect(await createInstagramProfileLookup(config, down)('u1')).toBeNull();
    const none = vi.fn();
    expect(
      await createInstagramProfileLookup({ ...config, accessToken: '' }, none)('u1'),
    ).toBeNull();
    expect(none).not.toHaveBeenCalled();
  });
});
