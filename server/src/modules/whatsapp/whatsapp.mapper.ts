import { z } from 'zod';
import type { IncomingMessage, MessageStatus, StatusUpdate } from '../conversations/types';

/**
 * Forma (simplificada) de lo que Meta envía al webhook. Solo se declaran los campos que usamos;
 * el resto se ignora. Ver docs/integracion-whatsapp.md.
 */
const webhookSchema = z.object({
  object: z.literal('whatsapp_business_account'),
  entry: z.array(
    z.object({
      changes: z.array(
        z.object({
          field: z.string(),
          value: z.object({
            metadata: z.object({ phone_number_id: z.string() }).optional(),
            contacts: z
              .array(
                z.object({ wa_id: z.string(), profile: z.object({ name: z.string() }).optional() }),
              )
              .optional(),
            messages: z
              .array(
                z.object({
                  from: z.string(),
                  id: z.string(),
                  timestamp: z.string(),
                  type: z.string(),
                  text: z.object({ body: z.string() }).optional(),
                }),
              )
              .optional(),
            statuses: z.array(z.object({ id: z.string(), status: z.string() })).optional(),
          }),
        }),
      ),
    }),
  ),
});

export interface ParsedWebhook {
  messages: IncomingMessage[];
  statuses: StatusUpdate[];
  /** Números de WhatsApp de eventos que se ignoraron por no ser el configurado. */
  ignoredPhoneNumberIds: string[];
}

const STATUS_MAP: Record<string, MessageStatus> = {
  sent: 'sent',
  delivered: 'delivered',
  read: 'read',
  failed: 'failed',
};

/**
 * Traduce el cuerpo del webhook al formato de Colibri.
 * Devuelve `null` si no tiene la forma esperada. Si se indica `phoneNumberId`, ignora los
 * eventos de otros números.
 */
export function parseWebhook(body: unknown, phoneNumberId?: string): ParsedWebhook | null {
  const parsed = webhookSchema.safeParse(body);
  if (!parsed.success) return null;

  const result: ParsedWebhook = { messages: [], statuses: [], ignoredPhoneNumberIds: [] };

  for (const entry of parsed.data.entry) {
    for (const change of entry.changes) {
      if (change.field !== 'messages') continue;
      const { value } = change;
      if (phoneNumberId && value.metadata && value.metadata.phone_number_id !== phoneNumberId) {
        result.ignoredPhoneNumberIds.push(value.metadata.phone_number_id);
        continue;
      }

      const names = new Map(value.contacts?.map((c) => [c.wa_id, c.profile?.name ?? null]));

      for (const message of value.messages ?? []) {
        const isText = message.type === 'text' && message.text !== undefined;
        result.messages.push({
          channel: 'whatsapp',
          contactId: message.from,
          contactName: names.get(message.from) ?? null,
          externalId: message.id,
          type: isText ? 'text' : 'unsupported',
          text: isText ? (message.text?.body ?? null) : null,
          createdAt: new Date(Number(message.timestamp) * 1000).toISOString(),
        });
      }

      for (const status of value.statuses ?? []) {
        const mapped = STATUS_MAP[status.status];
        if (mapped)
          result.statuses.push({ channel: 'whatsapp', externalId: status.id, status: mapped });
      }
    }
  }

  return result;
}
