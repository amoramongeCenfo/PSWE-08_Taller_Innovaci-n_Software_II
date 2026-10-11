import { describe, expect, it } from 'vitest';
import { parseWebhook } from './whatsapp.mapper';

function payload(value: object, field = 'messages') {
  return {
    object: 'whatsapp_business_account',
    entry: [{ changes: [{ field, value }] }],
  };
}

describe('parseWebhook', () => {
  it('traduce un mensaje de texto', () => {
    const result = parseWebhook(
      payload({
        metadata: { phone_number_id: '111' },
        contacts: [{ wa_id: '50688887777', profile: { name: 'Ana' } }],
        messages: [
          {
            from: '50688887777',
            id: 'wamid.1',
            timestamp: '1760000000',
            type: 'text',
            text: { body: 'Hola' },
          },
        ],
      }),
    );

    expect(result?.messages).toEqual([
      {
        channel: 'whatsapp',
        contactId: '50688887777',
        contactName: 'Ana',
        externalId: 'wamid.1',
        type: 'text',
        text: 'Hola',
        createdAt: new Date(1760000000 * 1000).toISOString(),
      },
    ]);
  });

  it('marca como no soportados los mensajes que no son texto', () => {
    const result = parseWebhook(
      payload({
        messages: [{ from: '506', id: 'wamid.2', timestamp: '1760000000', type: 'image' }],
      }),
    );
    expect(result?.messages[0]).toMatchObject({
      type: 'unsupported',
      text: null,
      contactName: null,
    });
  });

  it('traduce estados de entrega y descarta los desconocidos', () => {
    const result = parseWebhook(
      payload({
        statuses: [
          { id: 'wamid.3', status: 'delivered' },
          { id: 'wamid.4', status: 'algo_raro' },
        ],
      }),
    );
    expect(result?.statuses).toEqual([
      { channel: 'whatsapp', externalId: 'wamid.3', status: 'delivered' },
    ]);
  });

  it('ignora eventos de otro número cuando se indica el nuestro', () => {
    const body = payload({
      metadata: { phone_number_id: '999' },
      messages: [
        { from: '506', id: 'wamid.5', timestamp: '1760000000', type: 'text', text: { body: 'x' } },
      ],
    });
    expect(parseWebhook(body, '111')?.messages).toEqual([]);
    expect(parseWebhook(body, '111')?.ignoredPhoneNumberIds).toEqual(['999']);
    expect(parseWebhook(body, '999')?.messages).toHaveLength(1);
  });

  it('ignora campos que no son mensajes', () => {
    const body = payload(
      { messages: [{ from: '1', id: 'a', timestamp: '1', type: 'text', text: { body: 'x' } }] },
      'account_update',
    );
    expect(parseWebhook(body)?.messages).toEqual([]);
  });

  it('devuelve null si el cuerpo no tiene la forma esperada', () => {
    expect(parseWebhook(null)).toBeNull();
    expect(parseWebhook({ object: 'page', entry: [] })).toBeNull();
    expect(parseWebhook('hola')).toBeNull();
  });
});
