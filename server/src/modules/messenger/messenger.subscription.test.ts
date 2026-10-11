import { describe, expect, it, vi } from 'vitest';
import type { MessengerConfig } from '../../config';
import {
  createMessengerSubscription,
  MessengerSubscriptionError,
  UserTokenError,
} from './messenger.subscription';

const config: MessengerConfig = {
  verifyToken: 'v',
  appSecret: 's',
  pageAccessToken: 'token-pagina',
  pageId: '555',
  graphApiVersion: 'v23.0',
  debugWebhook: false,
};
const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

describe('createMessengerSubscription', () => {
  it('dice a qué página pertenece el token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(reply(200, { id: '555', name: 'Café Pura Vida' }));
    expect(await createMessengerSubscription(config, fetchMock).whoAmI()).toEqual({
      pageId: '555',
      name: 'Café Pura Vida',
    });
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe('https://graph.facebook.com/v23.0/me?fields=id,name,category');
  });

  it('detecta que el token es de un usuario y no de una página', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      reply(400, {
        error: {
          message: '(#100) Tried accessing nonexisting field (category) on node type (User)',
        },
      }),
    );
    const error = await createMessengerSubscription(config, fetchMock)
      .whoAmI()
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(UserTokenError);
    expect((error as Error).message).toContain('USUARIO');
  });

  it('lista y suscribe a mensajes y entregas', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        reply(200, { data: [{ id: '9', name: 'Colibri Dev', subscribed_fields: ['messages'] }] }),
      )
      .mockResolvedValueOnce(reply(200, { success: true }));
    const subscription = createMessengerSubscription(config, fetchMock);

    expect(await subscription.list()).toEqual([
      { id: '9', name: 'Colibri Dev', fields: ['messages'] },
    ]);
    await subscription.subscribe();
    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toBe(
      'https://graph.facebook.com/v23.0/me/subscribed_apps?subscribed_fields=messages,message_deliveries',
    );
    expect(init.method).toBe('POST');
  });

  it('muestra el mensaje de Meta sin filtrar el token', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(reply(400, { error: { message: 'Token inválido' } }));
    const error = await createMessengerSubscription(config, fetchMock)
      .whoAmI()
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(MessengerSubscriptionError);
    expect((error as Error).message).toBe('Token inválido');
    expect((error as Error).message).not.toContain('token-pagina');
  });

  it('avisa si falta el token y no llama a la red', async () => {
    const fetchMock = vi.fn();
    const subscription = createMessengerSubscription({ ...config, pageAccessToken: '' }, fetchMock);
    await expect(subscription.list()).rejects.toBeInstanceOf(MessengerSubscriptionError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
