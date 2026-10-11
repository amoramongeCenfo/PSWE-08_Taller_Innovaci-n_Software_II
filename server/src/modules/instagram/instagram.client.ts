import { randomUUID } from 'node:crypto';
import { canSendInstagram, type InstagramConfig } from '../../config';
import { ChannelSendError, type ChannelSender } from '../conversations/conversationService';

/** Meta responde con el código 10 (subcódigo 2534022) al escribir fuera de la ventana de 24 horas. */
const OUTSIDE_WINDOW_CODE = 10;
const OUTSIDE_WINDOW_SUBCODE = 2534022;

/** Prefijo de los contactos de demostración: "sim:Nombre". */
export const SIMULATED_PREFIX = 'sim:';

type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

interface GraphErrorBody {
  error?: { code?: number; error_subcode?: number; message?: string };
}

const baseUrl = (config: InstagramConfig) =>
  `https://graph.instagram.com/${config.graphApiVersion}`;

/** Envía mensajes por la API de Instagram de Meta. El token nunca sale del servidor. */
export function createInstagramClient(
  config: InstagramConfig,
  fetchImpl: FetchLike = fetch,
): ChannelSender {
  return {
    async sendText(to, text) {
      if (!canSendInstagram(config)) throw new ChannelSendError('NOT_CONFIGURED');
      // Demostración: no se llama a Meta; la respuesta queda guardada como enviada.
      if (config.simulate) return { externalId: `sim.${randomUUID()}` };

      let response: Response;
      try {
        response = await fetchImpl(`${baseUrl(config)}/${config.accountId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ recipient: { id: to }, message: { text } }),
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
          `Instagram: envío rechazado (HTTP ${response.status}, código ${error?.code}, subcódigo ${error?.error_subcode})`,
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

/** Busca el nombre público de quien escribe. Si falla, devuelve null: el mensaje se guarda igual. */
export function createInstagramProfileLookup(
  config: InstagramConfig,
  fetchImpl: FetchLike = fetch,
): (contactId: string) => Promise<string | null> {
  return async (contactId) => {
    // Demostración: el contacto "sim:Ana Mora" se muestra como "Ana Mora".
    if (config.simulate && contactId.startsWith(SIMULATED_PREFIX)) {
      return contactId.slice(SIMULATED_PREFIX.length).trim() || null;
    }
    if (!config.accessToken) return null;
    try {
      const response = await fetchImpl(
        `${baseUrl(config)}/${encodeURIComponent(contactId)}?fields=name,username`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${config.accessToken}` },
          signal: AbortSignal.timeout(5_000),
        },
      );
      if (!response.ok) return null;
      const body = (await response.json()) as { name?: string; username?: string };
      return body.name?.trim() || (body.username ? `@${body.username}` : null);
    } catch {
      return null;
    }
  };
}
