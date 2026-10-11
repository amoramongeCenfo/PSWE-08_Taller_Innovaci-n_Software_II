import { describe, expect, it, vi } from 'vitest';
import type { MessengerConfig } from '../../config';
import { createMessengerClient, createMessengerProfileLookup } from './messenger.client';

const config: MessengerConfig = {
  verifyToken: 'v',
  appSecret: 's',
  pageAccessToken: 'token-pagina',
  pageId: '555',
  graphApiVersion: 'v23.0',
  debugWebhook: false,
};
const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

describe('createMessengerClient', () => {
  it('envía la respuesta con el token de la página y devuelve el id', async () => {
    const fetchMock = vi.fn().mockResolvedValue(reply(200, { message_id: 'm_out' }));
    const result = await createMessengerClient(config, fetchMock).sendText('psid', 'Hola');

    expect(result).toEqual({ externalId: 'm_out' });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://graph.facebook.com/v23.0/555/messages');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer token-pagina');
    expect(JSON.parse(init.body as string)).toEqual({
      recipient: { id: 'psid' },
      messaging_type: 'RESPONSE',
      message: { text: 'Hola' },
    });
  });

  it('detecta la ventana de 24 horas vencida', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(reply(400, { error: { code: 10, error_subcode: 2018278 } }));
    await expect(
      createMessengerClient(config, fetchMock).sendText('psid', 'Hola'),
    ).rejects.toMatchObject({ reason: 'WINDOW_EXPIRED' });
  });

  it('falla con FAILED ante otros errores o si no hay respuesta', async () => {
    const rejected = vi.fn().mockResolvedValue(reply(400, { error: { code: 100 } }));
    await expect(
      createMessengerClient(config, rejected).sendText('psid', 'Hola'),
    ).rejects.toMatchObject({ reason: 'FAILED' });
    const down = vi.fn().mockRejectedValue(new Error('red'));
    await expect(
      createMessengerClient(config, down).sendText('psid', 'Hola'),
    ).rejects.toMatchObject({ reason: 'FAILED' });
  });

  it('falla con NOT_CONFIGURED sin token y no llama a la red', async () => {
    const fetchMock = vi.fn();
    const client = createMessengerClient({ ...config, pageAccessToken: '' }, fetchMock);
    await expect(client.sendText('psid', 'Hola')).rejects.toMatchObject({
      reason: 'NOT_CONFIGURED',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('createMessengerProfileLookup', () => {
  it('devuelve el nombre, o nombre y apellido si no viene completo', async () => {
    const named = vi.fn().mockResolvedValue(reply(200, { name: 'Luis Rojas' }));
    expect(await createMessengerProfileLookup(config, named)('p')).toBe('Luis Rojas');
    const parts = vi.fn().mockResolvedValue(reply(200, { first_name: 'Luis', last_name: 'Rojas' }));
    expect(await createMessengerProfileLookup(config, parts)('p')).toBe('Luis Rojas');
  });

  it('devuelve null si falla o no hay token', async () => {
    const failing = vi.fn().mockResolvedValue(reply(400, {}));
    expect(await createMessengerProfileLookup(config, failing)('p')).toBeNull();
    const none = vi.fn();
    expect(
      await createMessengerProfileLookup({ ...config, pageAccessToken: '' }, none)('p'),
    ).toBeNull();
    expect(none).not.toHaveBeenCalled();
  });
});
