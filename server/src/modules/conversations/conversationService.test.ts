import { describe, expect, it, vi } from 'vitest';
import { HttpError } from '../../lib/httpError';
import { ChannelSendError, ConversationService, type ChannelSender } from './conversationService';
import { MemoryConversationRepository } from './memoryConversationRepository';

const NOW = new Date('2026-10-08T12:00:00.000Z');

function build(sender?: ChannelSender) {
  const service = new ConversationService(
    new MemoryConversationRepository(),
    sender ? { whatsapp: sender } : {},
    () => NOW,
  );
  const receive = (createdAt: string, externalId = 'wamid.in') =>
    service.receive({
      channel: 'whatsapp',
      contactId: '506',
      contactName: 'Ana',
      externalId,
      type: 'text',
      text: 'Hola',
      createdAt,
    });
  return { service, receive };
}

async function firstConversationId(service: ConversationService) {
  const [conversation] = await service.list();
  return conversation!.id;
}

describe('ConversationService.reply', () => {
  it('envía y guarda la respuesta dentro de las 24 horas', async () => {
    const sendText = vi.fn().mockResolvedValue({ externalId: 'wamid.out' });
    const { service, receive } = build({ sendText });
    await receive('2026-10-08T08:00:00.000Z');

    const message = await service.reply(await firstConversationId(service), 'Abrimos a las 8');

    expect(sendText).toHaveBeenCalledWith('506', 'Abrimos a las 8');
    expect(message).toMatchObject({
      direction: 'outbound',
      status: 'sent',
      externalId: 'wamid.out',
    });
  });

  it('rechaza si pasaron más de 24 horas y no llama al canal', async () => {
    const sendText = vi.fn();
    const { service, receive } = build({ sendText });
    await receive('2026-10-07T11:00:00.000Z');

    await expect(service.reply(await firstConversationId(service), 'Hola')).rejects.toMatchObject({
      status: 409,
      code: 'REPLY_WINDOW_EXPIRED',
    });
    expect(sendText).not.toHaveBeenCalled();
  });

  it('traduce los errores del canal a errores HTTP claros', async () => {
    const cases: [ChannelSendError, number, string][] = [
      [new ChannelSendError('NOT_CONFIGURED'), 503, 'CHANNEL_NOT_CONFIGURED'],
      [new ChannelSendError('WINDOW_EXPIRED'), 409, 'REPLY_WINDOW_EXPIRED'],
      [new ChannelSendError('FAILED'), 502, 'CHANNEL_SEND_FAILED'],
    ];
    for (const [error, status, code] of cases) {
      const { service, receive } = build({ sendText: vi.fn().mockRejectedValue(error) });
      await receive('2026-10-08T08:00:00.000Z');
      await expect(service.reply(await firstConversationId(service), 'Hola')).rejects.toMatchObject(
        { status, code },
      );
    }
  });

  it('falla con 503 si el canal no tiene enviador', async () => {
    const { service, receive } = build();
    await receive('2026-10-08T08:00:00.000Z');
    await expect(service.reply(await firstConversationId(service), 'Hola')).rejects.toMatchObject({
      status: 503,
    });
  });

  it('falla con 404 si la conversación no existe', async () => {
    const { service } = build();
    await expect(service.reply('no-existe', 'Hola')).rejects.toBeInstanceOf(HttpError);
    await expect(service.listMessages('no-existe')).rejects.toMatchObject({ status: 404 });
  });
});

describe('ConversationService.reply en Instagram', () => {
  it('rechaza textos de más de 1000 bytes sin llamar al canal', async () => {
    const sendText = vi.fn();
    const service = new ConversationService(
      new MemoryConversationRepository(),
      { instagram: { sendText } },
      () => NOW,
    );
    await service.receive({
      channel: 'instagram',
      contactId: 'igsid',
      contactName: null,
      externalId: 'mid.in',
      type: 'text',
      text: 'Hola',
      createdAt: '2026-10-08T08:00:00.000Z',
    });
    const [conversation] = await service.list();

    await expect(service.reply(conversation!.id, 'a'.repeat(1001))).rejects.toMatchObject({
      status: 400,
      code: 'MESSAGE_TOO_LONG',
    });
    expect(sendText).not.toHaveBeenCalled();
  });
});

describe('ConversationService.reply en Messenger', () => {
  it('rechaza textos de más de 2000 caracteres sin llamar al canal', async () => {
    const sendText = vi.fn().mockResolvedValue({ externalId: 'm_out' });
    const service = new ConversationService(
      new MemoryConversationRepository(),
      { messenger: { sendText } },
      () => NOW,
    );
    await service.receive({
      channel: 'messenger',
      contactId: 'psid',
      contactName: null,
      externalId: 'm_in',
      type: 'text',
      text: 'Hola',
      createdAt: '2026-10-08T08:00:00.000Z',
    });
    const [conversation] = await service.list();

    await expect(service.reply(conversation!.id, 'a'.repeat(2001))).rejects.toMatchObject({
      code: 'MESSAGE_TOO_LONG',
    });
    expect(sendText).not.toHaveBeenCalled();
    await expect(service.reply(conversation!.id, 'á'.repeat(2000))).resolves.toMatchObject({
      externalId: 'm_out',
    });
  });
});

describe('ConversationService.receive', () => {
  it('no duplica un mensaje que el canal repite', async () => {
    const { service, receive } = build();
    expect((await receive('2026-10-08T08:00:00.000Z')).created).toBe(true);
    expect((await receive('2026-10-08T08:00:00.000Z')).created).toBe(false);
    expect(await service.listMessages(await firstConversationId(service))).toHaveLength(1);
  });
});
