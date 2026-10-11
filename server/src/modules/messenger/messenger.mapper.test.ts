import { describe, expect, it } from 'vitest';
import { explainInvalidMessengerWebhook, parseMessengerWebhook } from './messenger.mapper';

const body = (events: unknown[], pageId = '555') => ({
  object: 'page',
  entry: [{ id: pageId, time: 1, messaging: events }],
});

describe('parseMessengerWebhook', () => {
  it('traduce un mensaje de texto', () => {
    const result = parseMessengerWebhook(
      body([
        {
          sender: { id: 'psid' },
          recipient: { id: '555' },
          timestamp: 1_760_000_000_000,
          message: { mid: 'm1', text: 'Hola' },
        },
      ]),
    );
    expect(result?.messages).toEqual([
      {
        channel: 'messenger',
        contactId: 'psid',
        contactName: null,
        externalId: 'm1',
        type: 'text',
        text: 'Hola',
        createdAt: new Date(1_760_000_000_000).toISOString(),
      },
    ]);
  });

  it('marca como no soportado lo que no es texto e ignora los ecos', () => {
    const result = parseMessengerWebhook(
      body([
        { sender: { id: 'psid' }, message: { mid: 'm2' } },
        { sender: { id: '555' }, message: { mid: 'm3', text: 'x', is_echo: true } },
      ]),
    );
    expect(result?.messages).toHaveLength(1);
    expect(result?.messages[0]).toMatchObject({ type: 'unsupported', text: null });
  });

  it('traduce las entregas a "delivered" y acepta lecturas sin error', () => {
    const result = parseMessengerWebhook(
      body([
        { sender: { id: 'psid' }, delivery: { mids: ['m4', 'm5'], watermark: 1 } },
        { sender: { id: 'psid' }, read: { watermark: 1 } },
      ]),
    );
    expect(result?.statuses).toEqual([
      { channel: 'messenger', externalId: 'm4', status: 'delivered' },
      { channel: 'messenger', externalId: 'm5', status: 'delivered' },
    ]);
    expect(result?.unreadable).toEqual([]);
  });

  it('ignora otras páginas si se indica la configurada', () => {
    const result = parseMessengerWebhook(
      body([{ sender: { id: 'p' }, message: { mid: 'm6', text: 'x' } }], '123'),
      '555',
    );
    expect(result?.messages).toEqual([]);
    expect(result?.ignoredAccountIds).toEqual(['la página 123']);
  });

  it('reporta un evento ilegible sin incluir su contenido', () => {
    const result = parseMessengerWebhook(body([{ sender: 'secreto', message: { mid: 'm7' } }]));
    expect(result?.unreadable[0]).toContain('sender');
    expect(result?.unreadable[0]).not.toContain('secreto');
  });

  it('devuelve null si no es un evento de página y explica por qué', () => {
    expect(parseMessengerWebhook({ object: 'instagram', entry: [] })).toBeNull();
    expect(explainInvalidMessengerWebhook({ object: 'instagram', texto: 'no-sale' })).not.toContain(
      'no-sale',
    );
  });
});
