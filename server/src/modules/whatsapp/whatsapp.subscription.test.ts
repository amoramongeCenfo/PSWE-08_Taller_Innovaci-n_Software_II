import { describe, expect, it, vi } from 'vitest';
import type { WhatsAppConfig } from '../../config';
import { createWhatsAppSubscription, SubscriptionError } from './whatsapp.subscription';

const config: WhatsAppConfig = {
  verifyToken: 'v',
  appSecret: 's',
  accessToken: 'token-secreto',
  phoneNumberId: '111',
  businessAccountId: '222',
  graphApiVersion: 'v23.0',
};
const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

describe('createWhatsAppSubscription', () => {
  it('lista las apps suscritas', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        reply(200, { data: [{ whatsapp_business_api_data: { id: '9', name: 'Colibri Dev' } }] }),
      );
    const apps = await createWhatsAppSubscription(config, fetchMock).list();

    expect(apps).toEqual([{ id: '9', name: 'Colibri Dev' }]);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://graph.facebook.com/v23.0/222/subscribed_apps');
    expect(init.method).toBe('GET');
  });

  it('suscribe con POST y el token en el encabezado', async () => {
    const fetchMock = vi.fn().mockResolvedValue(reply(200, { success: true }));
    await createWhatsAppSubscription(config, fetchMock).subscribe();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer token-secreto');
  });

  it('muestra el mensaje de Meta sin filtrar el token', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(reply(400, { error: { message: 'Token expirado' } }));
    const error = await createWhatsAppSubscription(config, fetchMock)
      .subscribe()
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(SubscriptionError);
    expect((error as Error).message).toBe('Token expirado');
    expect((error as Error).message).not.toContain('token-secreto');
  });

  it('avisa si falta el id de la cuenta y no llama a la red', async () => {
    const fetchMock = vi.fn();
    const subscription = createWhatsAppSubscription(
      { ...config, businessAccountId: '' },
      fetchMock,
    );
    await expect(subscription.list()).rejects.toThrow('WHATSAPP_BUSINESS_ACCOUNT_ID');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
