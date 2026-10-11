import type { WhatsAppConfig } from '../../config';
import { canSendWhatsApp } from '../../config';
import { ChannelSendError, type ChannelSender } from '../conversations/conversationService';

/** Código con el que Meta rechaza un texto libre fuera de la ventana de 24 horas. */
const REENGAGEMENT_ERROR_CODE = 131047;

type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

interface GraphErrorBody {
  error?: { code?: number; message?: string };
}

/** Envía mensajes por la API de WhatsApp de Meta. El token nunca sale del servidor. */
export function createWhatsAppClient(
  config: WhatsAppConfig,
  fetchImpl: FetchLike = fetch,
): ChannelSender {
  return {
    async sendText(to, text) {
      if (!canSendWhatsApp(config)) throw new ChannelSendError('NOT_CONFIGURED');

      const url = `https://graph.facebook.com/${config.graphApiVersion}/${config.phoneNumberId}/messages`;
      let response: Response;
      try {
        response = await fetchImpl(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body: text },
          }),
          signal: AbortSignal.timeout(10_000),
        });
      } catch {
        throw new ChannelSendError('FAILED', 'No hubo respuesta de la API de Meta');
      }

      const body: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = (body as GraphErrorBody).error;
        // Se registra el código de Meta, nunca el token ni el cuerpo completo.
        console.error(`WhatsApp: envío rechazado (HTTP ${response.status}, código ${error?.code})`);
        if (error?.code === REENGAGEMENT_ERROR_CODE) throw new ChannelSendError('WINDOW_EXPIRED');
        throw new ChannelSendError('FAILED', error?.message);
      }

      const externalId = (body as { messages?: { id?: string }[] }).messages?.[0]?.id;
      if (!externalId) throw new ChannelSendError('FAILED', 'Meta no devolvió el id del mensaje');
      return { externalId };
    },
  };
}
