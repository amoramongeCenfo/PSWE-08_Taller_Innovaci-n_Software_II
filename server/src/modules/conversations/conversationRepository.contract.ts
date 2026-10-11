import { beforeEach, describe, expect, it } from 'vitest';
import type { ConversationRepository } from './conversationRepository';
import type { NewMessage } from './types';

/**
 * Pruebas que TODA implementación de ConversationRepository debe pasar.
 * `create` entrega un repositorio vacío para cada prueba.
 */
export function describeConversationRepository(
  name: string,
  create: () => Promise<ConversationRepository>,
): void {
  describe(name, () => {
    let repo: ConversationRepository;

    beforeEach(async () => {
      repo = await create();
    });

    async function setup() {
      const conversation = await repo.findOrCreate('whatsapp', '506', 'Ana');
      const base = (over: Partial<NewMessage>): NewMessage => ({
        conversationId: conversation.id,
        externalId: 'wamid.1',
        direction: 'inbound',
        type: 'text',
        text: 'Hola',
        status: 'received',
        createdAt: '2026-10-08T10:00:00.000Z',
        ...over,
      });
      return { conversation, base };
    }

    it('reutiliza la conversación de la misma persona y actualiza su nombre', async () => {
      const first = await repo.findOrCreate('whatsapp', '506', null);
      const second = await repo.findOrCreate('whatsapp', '506', 'Ana');
      expect(second.id).toBe(first.id);
      expect((await repo.get(first.id))?.contactName).toBe('Ana');
      expect(await repo.list()).toHaveLength(1);
    });

    it('no duplica un mensaje con el mismo id externo', async () => {
      const { conversation, base } = await setup();
      const a = await repo.addMessage('whatsapp', base({}));
      const b = await repo.addMessage('whatsapp', base({}));
      expect(a.created).toBe(true);
      expect(b.created).toBe(false);
      expect(await repo.listMessages(conversation.id)).toHaveLength(1);
    });

    it('actualiza el resumen y la ventana de 24 horas solo con mensajes de la persona', async () => {
      const { conversation, base } = await setup();
      await repo.addMessage('whatsapp', base({}));
      await repo.addMessage(
        'whatsapp',
        base({
          externalId: 'wamid.2',
          direction: 'outbound',
          status: 'sent',
          text: 'Respuesta',
          createdAt: '2026-10-08T10:05:00.000Z',
        }),
      );
      const updated = await repo.get(conversation.id);
      expect(updated?.lastMessagePreview).toBe('Respuesta');
      expect(updated?.lastInboundAt).toBe('2026-10-08T10:00:00.000Z');
    });

    it('ordena mensajes por fecha y conversaciones por la más reciente', async () => {
      const { conversation, base } = await setup();
      await repo.addMessage(
        'whatsapp',
        base({ externalId: 'b', createdAt: '2026-10-08T11:00:00.000Z', text: 'segundo' }),
      );
      await repo.addMessage(
        'whatsapp',
        base({ externalId: 'a', createdAt: '2026-10-08T10:00:00.000Z', text: 'primero' }),
      );
      expect((await repo.listMessages(conversation.id)).map((m) => m.text)).toEqual([
        'primero',
        'segundo',
      ]);

      const other = await repo.findOrCreate('whatsapp', '507', null);
      await repo.addMessage(
        'whatsapp',
        base({ conversationId: other.id, externalId: 'c', createdAt: '2026-10-09T09:00:00.000Z' }),
      );
      expect((await repo.list())[0]?.id).toBe(other.id);
    });

    it('sabe desde cuándo espera respuesta cada conversación', async () => {
      const ana = await repo.findOrCreate('whatsapp', '506', 'Ana');
      expect(ana.awaitingSince).toBeNull();
      const msg = (id: string, direction: 'inbound' | 'outbound', at: string) =>
        repo.addMessage('whatsapp', {
          conversationId: ana.id,
          externalId: id,
          direction,
          type: 'text',
          text: 'x',
          status: direction === 'inbound' ? 'received' : 'sent',
          createdAt: at,
        });

      await msg('w1', 'inbound', '2026-10-08T10:00:00.000Z');
      await msg('w2', 'inbound', '2026-10-08T10:05:00.000Z');
      expect((await repo.get(ana.id))?.awaitingSince).toBe('2026-10-08T10:00:00.000Z');

      await msg('w3', 'outbound', '2026-10-08T10:10:00.000Z');
      expect((await repo.get(ana.id))?.awaitingSince).toBeNull();

      await msg('w4', 'inbound', '2026-10-08T11:00:00.000Z');
      const [listed] = await repo.list();
      expect(listed?.awaitingSince).toBe('2026-10-08T11:00:00.000Z');
    });

    it('calcula el tiempo promedio de respuesta por turno', async () => {
      const ana = await repo.findOrCreate('whatsapp', '506', 'Ana');
      const luis = await repo.findOrCreate('whatsapp', '507', 'Luis');
      const msg = (
        conversationId: string,
        id: string,
        direction: 'inbound' | 'outbound',
        at: string,
      ) =>
        repo.addMessage('whatsapp', {
          conversationId,
          externalId: id,
          direction,
          type: 'text',
          text: 'x',
          status: direction === 'inbound' ? 'received' : 'sent',
          createdAt: at,
        });

      expect(await repo.responseTimeStats('2026-10-01T00:00:00.000Z')).toEqual({
        averageSeconds: null,
        samples: 0,
      });

      // Ana escribe dos veces seguidas: el turno empieza en la primera. Respuesta a los 120 s.
      await msg(ana.id, 'a1', 'inbound', '2026-10-08T10:00:00.000Z');
      await msg(ana.id, 'a2', 'inbound', '2026-10-08T10:01:00.000Z');
      await msg(ana.id, 'a3', 'outbound', '2026-10-08T10:02:00.000Z');
      // Una segunda respuesta seguida no cuenta como otro turno.
      await msg(ana.id, 'a4', 'outbound', '2026-10-08T10:03:00.000Z');
      // Luis: respuesta a los 60 s.
      await msg(luis.id, 'l1', 'inbound', '2026-10-08T11:00:00.000Z');
      await msg(luis.id, 'l2', 'outbound', '2026-10-08T11:01:00.000Z');
      // Turno sin responder: no cuenta.
      await msg(luis.id, 'l3', 'inbound', '2026-10-08T12:00:00.000Z');

      expect(await repo.responseTimeStats('2026-10-01T00:00:00.000Z')).toEqual({
        averageSeconds: 90,
        samples: 2,
      });
      // Solo respuestas enviadas desde la fecha indicada.
      expect(await repo.responseTimeStats('2026-10-08T10:30:00.000Z')).toEqual({
        averageSeconds: 60,
        samples: 1,
      });
    });

    it('cuenta las respuestas automáticas desde una fecha', async () => {
      const { base } = await setup();
      expect(await repo.countAutoReplies('2026-10-01T00:00:00.000Z')).toBe(0);
      await repo.addMessage('whatsapp', base({}));
      const outbound = { direction: 'outbound' as const, status: 'sent' as const };
      await repo.addMessage(
        'whatsapp',
        base({
          ...outbound,
          externalId: 'c1',
          author: 'colibri',
          createdAt: '2026-10-08T10:00:05.000Z',
        }),
      );
      await repo.addMessage(
        'whatsapp',
        base({ ...outbound, externalId: 'p1', createdAt: '2026-10-08T10:05:00.000Z' }),
      );
      await repo.addMessage(
        'whatsapp',
        base({
          ...outbound,
          externalId: 'c0',
          author: 'colibri',
          createdAt: '2026-09-01T10:00:00.000Z',
        }),
      );
      expect(await repo.countAutoReplies('2026-10-01T00:00:00.000Z')).toBe(1);
      expect((await repo.listMessages(base({}).conversationId)).map((m) => m.author)).toEqual([
        'colibri',
        'customer',
        'colibri',
        'person',
      ]);
    });

    it('el estado de un mensaje enviado avanza pero no retrocede', async () => {
      const { conversation, base } = await setup();
      await repo.addMessage('whatsapp', base({ direction: 'outbound', status: 'sent' }));
      await repo.updateMessageStatus('whatsapp', 'wamid.1', 'read');
      await repo.updateMessageStatus('whatsapp', 'wamid.1', 'delivered');
      expect((await repo.listMessages(conversation.id))[0]?.status).toBe('read');
      await repo.updateMessageStatus('whatsapp', 'wamid.1', 'failed');
      expect((await repo.listMessages(conversation.id))[0]?.status).toBe('failed');
    });

    it('ignora el estado de un mensaje desconocido', async () => {
      await expect(
        repo.updateMessageStatus('whatsapp', 'no-existe', 'read'),
      ).resolves.toBeUndefined();
    });
  });
}
