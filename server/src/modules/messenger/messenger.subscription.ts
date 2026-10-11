import type { MessengerConfig } from '../../config';

type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export interface PageSubscription {
  id: string | null;
  name: string | null;
  fields: string[];
}

export interface PageIdentity {
  /** Identificador de la página: el que debe ir en MESSENGER_PAGE_ID. */
  pageId: string | null;
  name: string | null;
}

interface ErrorBody {
  error?: { message?: string; code?: number };
}

interface MeBody extends ErrorBody {
  id?: string;
  name?: string;
}

interface SubscribedAppsBody extends ErrorBody {
  data?: { id?: string; name?: string; subscribed_fields?: string[] }[];
}

export class MessengerSubscriptionError extends Error {}

/** Se pegó el token de la PERSONA en lugar del de la página (error común en Graph API Explorer). */
export class UserTokenError extends MessengerSubscriptionError {
  constructor() {
    super(
      'El token es de un USUARIO, no de una página. En Graph API Explorer elige tu página en el menú "User or Page" (o "Get Page Access Token") y copia ese token.',
    );
  }
}

/** Eventos que Colibri usa: mensajes y confirmaciones de entrega. */
const FIELDS = ['messages', 'message_deliveries'];

/**
 * Meta solo envía los mensajes de una página a las apps SUSCRITAS a ella. Igual que en WhatsApp
 * e Instagram, configurar el webhook en el panel no siempre basta.
 */
export function createMessengerSubscription(config: MessengerConfig, fetchImpl: FetchLike = fetch) {
  // "me" con un token de página es la propia página: no depende de que MESSENGER_PAGE_ID esté bien.
  const root = `https://graph.facebook.com/${config.graphApiVersion}/me`;
  const headers = { Authorization: `Bearer ${config.pageAccessToken}` };

  async function call<T extends ErrorBody>(method: 'GET' | 'POST', path: string): Promise<T> {
    if (!config.pageAccessToken) {
      throw new MessengerSubscriptionError('Falta MESSENGER_PAGE_ACCESS_TOKEN en server/.env');
    }
    const response = await fetchImpl(`${root}${path}`, {
      method,
      headers,
      signal: AbortSignal.timeout(10_000),
    });
    const body = (await response.json().catch(() => ({}))) as T;
    if (!response.ok) {
      // Solo el mensaje de Meta; nunca el token.
      throw new MessengerSubscriptionError(
        body.error?.message ?? `Meta respondió HTTP ${response.status}`,
      );
    }
    return body;
  }

  return {
    /** La página a la que pertenece el token. */
    async whoAmI(): Promise<PageIdentity> {
      // "category" solo existe en las páginas: si Meta dice que no existe, el token es de un usuario.
      try {
        const body = await call<MeBody>('GET', '?fields=id,name,category');
        return { pageId: body.id ?? null, name: body.name ?? null };
      } catch (error) {
        if (error instanceof MessengerSubscriptionError && error.message.includes('(category)')) {
          throw new UserTokenError();
        }
        throw error;
      }
    },
    /** Apps suscritas hoy a la página, con los eventos que reciben. */
    async list(): Promise<PageSubscription[]> {
      const body = await call<SubscribedAppsBody>('GET', '/subscribed_apps');
      return (body.data ?? []).map((item) => ({
        id: item.id ?? null,
        name: item.name ?? null,
        fields: item.subscribed_fields ?? [],
      }));
    },
    /** Suscribe la app dueña del token a los eventos de mensajes de la página. */
    async subscribe(): Promise<void> {
      await call<SubscribedAppsBody>(
        'POST',
        `/subscribed_apps?subscribed_fields=${FIELDS.join(',')}`,
      );
    },
  };
}
