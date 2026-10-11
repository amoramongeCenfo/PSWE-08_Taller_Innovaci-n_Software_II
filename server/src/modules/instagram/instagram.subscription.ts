import type { InstagramConfig } from '../../config';

type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export interface InstagramSubscription {
  id: string | null;
  name: string | null;
  fields: string[];
}

interface MeBody {
  user_id?: string;
  id?: string;
  username?: string;
  error?: { message?: string; code?: number };
}

interface SubscribedAppsBody {
  data?: { id?: string; name?: string; subscribed_fields?: string[] }[];
  error?: { message?: string; code?: number };
}

export interface InstagramIdentity {
  /** Identificador de la cuenta profesional: el que debe ir en INSTAGRAM_ACCOUNT_ID. */
  accountId: string | null;
  username: string | null;
}

export class InstagramSubscriptionError extends Error {}

/** Eventos que Colibri usa: mensajes y confirmaciones de lectura. */
const FIELDS = ['messages', 'messaging_seen'];

/**
 * Meta solo envía los mensajes reales de una cuenta de Instagram a las apps SUSCRITAS a ella.
 * Configurar el webhook en el panel no siempre la suscribe: sin esto, el botón "Test" funciona
 * pero los mensajes reales nunca llegan (lo mismo que pasó con WhatsApp).
 */
export function createInstagramSubscription(config: InstagramConfig, fetchImpl: FetchLike = fetch) {
  // "me" es la cuenta dueña del token: así no depende de que INSTAGRAM_ACCOUNT_ID esté bien.
  const root = `https://graph.instagram.com/${config.graphApiVersion}/me`;
  const headers = { Authorization: `Bearer ${config.accessToken}` };

  async function call<T extends { error?: { message?: string } }>(
    method: 'GET' | 'POST',
    path: string,
  ): Promise<T> {
    if (!config.accessToken) {
      throw new InstagramSubscriptionError('Falta INSTAGRAM_ACCESS_TOKEN en server/.env');
    }
    const response = await fetchImpl(`${root}${path}`, {
      method,
      headers,
      signal: AbortSignal.timeout(10_000),
    });
    const body = (await response.json().catch(() => ({}))) as T;
    if (!response.ok) {
      // Solo el mensaje de Meta; nunca el token.
      throw new InstagramSubscriptionError(
        body.error?.message ?? `Meta respondió HTTP ${response.status}`,
      );
    }
    return body;
  }

  return {
    /** La cuenta a la que pertenece el token. */
    async whoAmI(): Promise<InstagramIdentity> {
      const body = await call<MeBody>('GET', '?fields=user_id,username');
      return { accountId: body.user_id ?? body.id ?? null, username: body.username ?? null };
    },
    /** Apps suscritas hoy a la cuenta, con los eventos que reciben. */
    async list(): Promise<InstagramSubscription[]> {
      const body = await call<SubscribedAppsBody>('GET', '/subscribed_apps');
      return (body.data ?? []).map((item) => ({
        id: item.id ?? null,
        name: item.name ?? null,
        fields: item.subscribed_fields ?? [],
      }));
    },
    /** Suscribe la app dueña del token a los eventos de mensajes de la cuenta. */
    async subscribe(): Promise<void> {
      await call<SubscribedAppsBody>(
        'POST',
        `/subscribed_apps?subscribed_fields=${FIELDS.join(',')}`,
      );
    },
  };
}
