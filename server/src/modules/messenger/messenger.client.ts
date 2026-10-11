import { canSendMessenger, type MessengerConfig } from '../../config';
import { ChannelSendError, type ChannelSender } from '../conversations/conversationService';

/** Meta responde código 10 (subcódigo 2018278) al escribir fuera de la ventana de 24 horas. */
const OUTSIDE_WINDOW_CODE = 10;
const OUTSIDE_WINDOW_SUBCODE = 2018278;

type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

interface GraphErrorBody {
  error?: { code?: number; error_subcode?: number; message?: string };
}

const baseUrl = (config: MessengerConfig) => `https://graph.facebook.com/${config.graphApiVersion}`;

/** Envía mensajes por la API de Messenger de Meta. El token nunca sale del servidor. */
export function createMessengerClient(
  config: MessengerConfig,
  fetchImpl: FetchLike = fetch,
): ChannelSender {
  return {
    async sendText(to, text) {
      if (!canSendMessenger(config)) throw new ChannelSendError('NOT_CONFIGURED');

      let response: Response;
      try {
        response = await fetchImpl(`${baseUrl(config)}/${config.pageId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.pageAccessToken}`,
            'Content-Type': 'application/json',
          },
          // RESPONSE: respuesta a un mensaje de la persona, dentro de la ventana de 24 horas.
          body: JSON.stringify({
            recipient: { id: to },
            messaging_type: 'RESPONSE',
            message: { text },
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
        console.error(
          `Messenger: envío rechazado (HTTP ${response.status}, código ${error?.code}, subcódigo ${error?.error_subcode})`,
        );
        if (error?.code === OUTSIDE_WINDOW_CODE && error.error_subcode === OUTSIDE_WINDOW_SUBCODE) {
          throw new ChannelSendError('WINDOW_EXPIRED');
        }
        throw new ChannelSendError('FAILED', error?.message);
      }

      const externalId = (body as { message_id?: string }).message_id;
      if (!externalId) throw new ChannelSendError('FAILED', 'Meta no devolvió el id del mensaje');
      return { externalId };
    },
  };
}

/** Busca el nombre de quien escribe. Si falla, devuelve null: el mensaje se guarda igual. */
export function createMessengerProfileLookup(
  config: MessengerConfig,
  fetchImpl: FetchLike = fetch,
): (contactId: string) => Promise<string | null> {
  return async (contactId) => {
    if (!config.pageAccessToken) return null;
    try {
      const response = await fetchImpl(
        `${baseUrl(config)}/${encodeURIComponent(contactId)}?fields=first_name,last_name,name`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${config.pageAccessToken}` },
          signal: AbortSignal.timeout(5_000),
        },
      );
      if (!response.ok) return null;
      const body = (await response.json()) as {
        name?: string;
        first_name?: string;
        last_name?: string;
      };
      const fullName = [body.first_name, body.last_name].filter(Boolean).join(' ');
      return body.name?.trim() || fullName.trim() || null;
    } catch {
      return null;
    }
  };
}
