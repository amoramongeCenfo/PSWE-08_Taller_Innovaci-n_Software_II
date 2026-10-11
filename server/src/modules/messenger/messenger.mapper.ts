import { z } from 'zod';
import { describeKeys, explainShape, toIsoDate } from '../../lib/webhookDiagnostics';
import type { ParsedMetaWebhook } from '../channels/metaWebhookRouter';

/**
 * Forma (simplificada) de lo que Meta envía al webhook de Messenger. Solo se declaran los campos
 * que usamos. Cada `entry` es una página; sus eventos vienen en `messaging[]`.
 * Ver docs/integracion-messenger.md.
 */
const eventSchema = z.object({
  /** PSID: identificador de la persona para esta página. Los avisos pueden no traerlo. */
  sender: z.object({ id: z.coerce.string() }).optional(),
  recipient: z.object({ id: z.coerce.string() }).optional(),
  timestamp: z.union([z.number(), z.string()]).optional(),
  message: z
    .object({
      mid: z.string(),
      text: z.string().optional(),
      is_echo: z.boolean().optional(),
    })
    .optional(),
  /** Confirmación de entrega de mensajes que enviamos. */
  delivery: z.object({ mids: z.array(z.string()).optional() }).optional(),
});

type MessengerEvent = z.infer<typeof eventSchema>;

const webhookSchema = z.object({
  object: z.literal('page'),
  entry: z.array(
    z.object({
      /** Página que recibió el evento. */
      id: z.coerce.string(),
      messaging: z.array(z.unknown()).optional(),
    }),
  ),
});

/**
 * Traduce el cuerpo del webhook al formato de Colibri. Devuelve `null` si no tiene la forma
 * esperada. Si se indica `pageId`, ignora los eventos de otras páginas. Los "ecos" (mensajes que
 * envió la propia página) no se guardan: nuestras respuestas ya se guardan al enviarlas.
 * Las lecturas (`read`) de Messenger no traen el id del mensaje, sino una fecha: se ignoran.
 */
export function parseMessengerWebhook(body: unknown, pageId?: string): ParsedMetaWebhook | null {
  const parsed = webhookSchema.safeParse(body);
  if (!parsed.success) return null;

  const result: ParsedMetaWebhook = {
    messages: [],
    statuses: [],
    ignoredAccountIds: [],
    unreadable: [],
  };

  for (const entry of parsed.data.entry) {
    if (pageId && entry.id !== pageId) {
      result.ignoredAccountIds.push(`la página ${entry.id}`);
      continue;
    }
    for (const candidate of entry.messaging ?? []) {
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

function collect(event: MessengerEvent, result: ParsedMetaWebhook): void {
  const { message } = event;
  if (message && !message.is_echo && event.sender) {
    const hasText = message.text !== undefined;
    result.messages.push({
      channel: 'messenger',
      contactId: event.sender.id,
      contactName: null,
      externalId: message.mid,
      type: hasText ? 'text' : 'unsupported',
      text: hasText ? (message.text ?? null) : null,
      createdAt: toIsoDate(event.timestamp),
    });
  }
  for (const mid of event.delivery?.mids ?? []) {
    result.statuses.push({ channel: 'messenger', externalId: mid, status: 'delivered' });
  }
}

/** Por qué un cuerpo no es un evento de Messenger (solo nombres de campos, nunca su contenido). */
export function explainInvalidMessengerWebhook(body: unknown): string {
  const parsed = webhookSchema.safeParse(body);
  return explainShape(body, parsed.success ? null : parsed.error.issues);
}
