import { describe, expect, it } from 'vitest';
import { explainInvalidWebhook, parseInstagramWebhook } from './instagram.mapper';

const event = (overrides: Record<string, unknown>, entryId = '999') => ({
  object: 'instagram',
  entry: [
    {
      id: entryId,
      messaging: [
        {
          sender: { id: 'u1' },
          recipient: { id: '999' },
          timestamp: 1_760_000_000_000,
          ...overrides,
        },
      ],
    },
  ],
});

describe('parseInstagramWebhook', () => {
  it('traduce un mensaje de texto', () => {
    const result = parseInstagramWebhook(event({ message: { mid: 'm1', text: 'Hola' } }));
    expect(result?.messages).toEqual([
      {
        channel: 'instagram',
        contactId: 'u1',
        contactName: null,
        externalId: 'm1',
        type: 'text',
        text: 'Hola',
        createdAt: new Date(1_760_000_000_000).toISOString(),
      },
    ]);
  });

  it('marca como no soportado lo que no es texto', () => {
    const result = parseInstagramWebhook(event({ message: { mid: 'm2' } }));
    expect(result?.messages[0]).toMatchObject({ type: 'unsupported', text: null });
  });

  it('ignora los ecos de lo que envió la propia cuenta', () => {
    const result = parseInstagramWebhook(
      event({ message: { mid: 'm3', text: 'x', is_echo: true } }),
    );
    expect(result?.messages).toEqual([]);
  });

  it('traduce las lecturas a estado "read"', () => {
    const result = parseInstagramWebhook(event({ read: { mid: 'm4' } }));
    expect(result?.statuses).toEqual([{ channel: 'instagram', externalId: 'm4', status: 'read' }]);
  });

  it('acepta un "visto" sin remitente', () => {
    const body = {
      object: 'instagram',
      entry: [{ id: '999', messaging: [{ timestamp: 1_760_000_000_000, read: { mid: 'm7' } }] }],
    };
    const result = parseInstagramWebhook(body);
    expect(result?.unreadable).toEqual([]);
    expect(result?.statuses).toEqual([{ channel: 'instagram', externalId: 'm7', status: 'read' }]);
  });

  it('ignora otras cuentas si se indica la configurada', () => {
    const body = event({ message: { mid: 'm5', text: 'x' } }, '123');
    const result = parseInstagramWebhook(body, '999');
    expect(result?.messages).toEqual([]);
    expect(result?.ignoredAccountIds).toEqual(['123']);
  });

  it('devuelve null si no es un evento de Instagram', () => {
    expect(parseInstagramWebhook({ object: 'page', entry: [] })).toBeNull();
    expect(parseInstagramWebhook(null)).toBeNull();
  });

  it('lee también la forma con "changes" y marcas de tiempo en segundos o texto', () => {
    const body = {
      object: 'instagram',
      entry: [
        {
          id: 999,
          changes: [
            {
              field: 'messages',
              value: {
                sender: { id: 'u9' },
                recipient: { id: '999' },
                timestamp: '1760000000',
                message: { mid: 'm9', text: 'Hola' },
              },
            },
            { field: 'comments', value: { text: 'otra cosa' } },
          ],
        },
      ],
    };
    const result = parseInstagramWebhook(body, '999');
    expect(result?.messages).toHaveLength(1);
    expect(result?.messages[0]).toMatchObject({
      contactId: 'u9',
      externalId: 'm9',
      createdAt: new Date(1_760_000_000_000).toISOString(),
    });
  });

  it('no se cae por un evento ilegible: lo reporta y sigue con los demás', () => {
    const body = {
      object: 'instagram',
      entry: [
        {
          id: '999',
          messaging: [{ sender: 5 }, { sender: { id: 'u1' }, message: { mid: 'm1', text: 'ok' } }],
        },
      ],
    };
    const result = parseInstagramWebhook(body);
    expect(result?.messages).toHaveLength(1);
    expect(result?.unreadable).toEqual(['sender; claves del evento: sender']);
  });

  it('al reportar un evento ilegible muestra las claves pero no los valores', () => {
    const body = {
      object: 'instagram',
      entry: [
        {
          id: '1',
          messaging: [{ sender: 'x', foo: { bar: 'valor-secreto' }, message_edit: 'otro-secreto' }],
        },
      ],
    };
    const [report] = parseInstagramWebhook(body)?.unreadable ?? [];
    expect(report).toContain('foo{bar}');
    expect(report).toContain('message_edit');
    expect(report).not.toContain('secreto');
  });

  it('explica por qué un cuerpo no sirve, sin incluir su contenido', () => {
    const explanation = explainInvalidWebhook({ object: 'page', secreto: 'no-debe-salir' });
    expect(explanation).toContain('object="page"');
    expect(explanation).toContain('campos: object, secreto');
    expect(explanation).not.toContain('no-debe-salir');
    expect(explainInvalidWebhook(null)).toContain('no es un objeto');
  });
});
