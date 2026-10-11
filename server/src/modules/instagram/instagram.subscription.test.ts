import { describe, expect, it, vi } from 'vitest';
import type { InstagramConfig } from '../../config';
import { createInstagramSubscription, InstagramSubscriptionError } from './instagram.subscription';

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

describe('createInstagramSubscription', () => {
  it('lista las apps suscritas con sus eventos', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      reply(200, {
        data: [{ id: '9', name: 'Colibri integra', subscribed_fields: ['messages'] }],
      }),
    );
    const apps = await createInstagramSubscription(config, fetchMock).list();

    expect(apps).toEqual([{ id: '9', name: 'Colibri integra', fields: ['messages'] }]);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://graph.instagram.com/v23.0/me/subscribed_apps');
    expect(init.method).toBe('GET');
  });

  it('suscribe a mensajes y lecturas con POST y el token en el encabezado', async () => {
    const fetchMock = vi.fn().mockResolvedValue(reply(200, { success: true }));
    await createInstagramSubscription(config, fetchMock).subscribe();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://graph.instagram.com/v23.0/me/subscribed_apps?subscribed_fields=messages,messaging_seen',
    );
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer token-secreto');
  });

  it('muestra el mensaje de Meta sin filtrar el token', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(reply(400, { error: { message: 'Token expirado' } }));
    const error = await createInstagramSubscription(config, fetchMock)
      .subscribe()
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(InstagramSubscriptionError);
    expect((error as Error).message).toBe('Token expirado');
    expect((error as Error).message).not.toContain('token-secreto');
  });

  it('dice a qué cuenta pertenece el token', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(reply(200, { user_id: '1784', username: 'colibri' }));
    expect(await createInstagramSubscription(config, fetchMock).whoAmI()).toEqual({
      accountId: '1784',
      username: 'colibri',
    });
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe('https://graph.instagram.com/v23.0/me?fields=user_id,username');
  });

  it('avisa si falta el token y no llama a la red', async () => {
    const fetchMock = vi.fn();
    const subscription = createInstagramSubscription({ ...config, accessToken: '' }, fetchMock);
    await expect(subscription.list()).rejects.toBeInstanceOf(InstagramSubscriptionError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
