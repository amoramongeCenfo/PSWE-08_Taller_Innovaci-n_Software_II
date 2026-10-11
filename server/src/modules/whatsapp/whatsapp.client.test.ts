import { describe, expect, it, vi } from 'vitest';
import type { WhatsAppConfig } from '../../config';
import { ChannelSendError } from '../conversations/conversationService';
import { createWhatsAppClient } from './whatsapp.client';

const config: WhatsAppConfig = {
  verifyToken: 'v',
  appSecret: 's',
  accessToken: 'token-secreto',
  phoneNumberId: '111',
  businessAccountId: '222',
  graphApiVersion: 'v23.0',
};
const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

describe('createWhatsAppClient', () => {
  it('envía el texto a la API de Meta con el token y devuelve el id', async () => {
    const fetchMock = vi.fn().mockResolvedValue(reply(200, { messages: [{ id: 'wamid.out' }] }));
    const result = await createWhatsAppClient(config, fetchMock).sendText('506', 'Hola');

    expect(result).toEqual({ externalId: 'wamid.out' });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://graph.facebook.com/v23.0/111/messages');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer token-secreto');
    expect(JSON.parse(init.body as string)).toEqual({
      messaging_product: 'whatsapp',
      to: '506',
      type: 'text',
      text: { body: 'Hola' },
    });
  });

  it('detecta la ventana de 24 horas vencida', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(reply(400, { error: { code: 131047, message: 'x' } }));
    await expect(
      createWhatsAppClient(config, fetchMock).sendText('506', 'Hola'),
    ).rejects.toMatchObject({
      reason: 'WINDOW_EXPIRED',
    });
  });

  it('falla con FAILED ante otros errores o si no hay respuesta', async () => {
    const rejected = vi.fn().mockResolvedValue(reply(500, { error: { code: 1 } }));
    await expect(
      createWhatsAppClient(config, rejected).sendText('506', 'Hola'),
    ).rejects.toMatchObject({ reason: 'FAILED' });
    const down = vi.fn().mockRejectedValue(new Error('red'));
    await expect(createWhatsAppClient(config, down).sendText('506', 'Hola')).rejects.toBeInstanceOf(
      ChannelSendError,
    );
  });

  it('falla con NOT_CONFIGURED sin token y no llama a la red', async () => {
    const fetchMock = vi.fn();
    const client = createWhatsAppClient({ ...config, accessToken: '' }, fetchMock);
    await expect(client.sendText('506', 'Hola')).rejects.toMatchObject({
      reason: 'NOT_CONFIGURED',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
