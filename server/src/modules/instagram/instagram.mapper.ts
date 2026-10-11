import { z } from 'zod';
import { describeKeys, explainShape, toIsoDate } from '../../lib/webhookDiagnostics';
import type { ParsedMetaWebhook } from '../channels/metaWebhookRouter';

/**
 * Forma (simplificada) de lo que Meta envía al webhook de Instagram. Solo se declaran los campos
 * que usamos. Meta usa dos formas según el evento y la versión de la API:
 *   - `entry[].messaging[]`: cada elemento es el evento.
 *   - `entry[].changes[]` con `field: "messages"`: el evento viene en `value`.
 * Ver docs/integracion-instagram.md.
 */
const eventSchema = z.object({
  /** Los avisos de "visto" (`read`) pueden llegar sin remitente; los mensajes siempre lo traen. */
  sender: z.object({ id: z.coerce.string() }).optional(),
  recipient: z.object({ id: z.coerce.string() }).optional(),
  /** Segundos o milisegundos desde 1970, como número o texto. */
  timestamp: z.union([z.number(), z.string()]).optional(),
  message: z
    .object({
      mid: z.string(),
      text: z.string().optional(),
      is_echo: z.boolean().optional(),
    })
    .optional(),
  read: z.object({ mid: z.string() }).optional(),
});

type InstagramEvent = z.infer<typeof eventSchema>;

const webhookSchema = z.object({
  object: z.literal('instagram'),
  entry: z.array(
    z.object({
      /** Cuenta de Instagram que recibió el evento. */
      id: z.coerce.string(),
      messaging: z.array(z.unknown()).optional(),
      changes: z.array(z.object({ field: z.string(), value: z.unknown() })).optional(),
    }),
  ),
});

export type ParsedInstagramWebhook = ParsedMetaWebhook;

/**
 * Traduce el cuerpo del webhook al formato de Colibri. Devuelve `null` si no tiene la forma
 * esperada. Si se indica `accountId`, ignora los eventos de otras cuentas. Los "ecos" (mensajes
 * que envió la propia cuenta) no se guardan: nuestras respuestas ya se guardan al enviarlas.
 */
export function parseInstagramWebhook(
  body: unknown,
  accountId?: string,
): ParsedInstagramWebhook | null {
  const parsed = webhookSchema.safeParse(body);
  if (!parsed.success) return null;

  const result: ParsedInstagramWebhook = {
    messages: [],
    statuses: [],
    ignoredAccountIds: [],
    unreadable: [],
  };

  for (const entry of parsed.data.entry) {
    if (accountId && entry.id !== accountId) {
      result.ignoredAccountIds.push(entry.id);
      continue;
    }

    const candidates: unknown[] = [
      ...(entry.messaging ?? []),
      ...(entry.changes ?? []).filter((c) => c.field === 'messages').map((c) => c.value),
    ];

    for (const candidate of candidates) {
      const event = eventSchema.safeParse(candidate);
      if (!event.success) {
        const failed = event.error.issues.map((issue) => issue.path.join('.')).join(', ');
        result.unreadable.push(`${failed}; claves del evento: ${describeKeys(candidate)}`);
        continue;
      }
      collect(event.data, result);
    }
  }

  return result;
}

function collect(event: InstagramEvent, result: ParsedInstagramWebhook): void {
  const { message } = event;
  if (message && !message.is_echo && event.sender) {
    const hasText = message.text !== undefined;
    result.messages.push({
      channel: 'instagram',
      contactId: event.sender.id,
      contactName: null,
      externalId: message.mid,
      type: hasText ? 'text' : 'unsupported',
      text: hasText ? (message.text ?? null) : null,
      createdAt: toIsoDate(event.timestamp),
    });
  }
  if (event.read) {
    result.statuses.push({ channel: 'instagram', externalId: event.read.mid, status: 'read' });
  }
}

/** Por qué un cuerpo no es un evento de Instagram (solo nombres de campos, nunca su contenido). */
export function explainInvalidWebhook(body: unknown): string {
  const parsed = webhookSchema.safeParse(body);
  return explainShape(body, parsed.success ? null : parsed.error.issues);
}
