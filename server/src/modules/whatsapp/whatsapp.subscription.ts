import type { WhatsAppConfig } from '../../config';

type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export interface SubscribedApp {
  id: string | null;
  name: string | null;
}

interface SubscribedAppsBody {
  data?: { whatsapp_business_api_data?: { id?: string; name?: string } }[];
  error?: { message?: string; code?: number };
}

export class SubscriptionError extends Error {}

/**
 * Meta solo envía los mensajes reales de una cuenta de WhatsApp Business (WABA) a las apps que
 * están SUSCRITAS a ella. Configurar el webhook en el panel no siempre la suscribe: sin esto, el
 * botón "Test" funciona pero los mensajes reales nunca llegan.
 */
export function createWhatsAppSubscription(config: WhatsAppConfig, fetchImpl: FetchLike = fetch) {
  const url = `https://graph.facebook.com/${config.graphApiVersion}/${config.businessAccountId}/subscribed_apps`;
  const headers = { Authorization: `Bearer ${config.accessToken}` };

  async function call(method: 'GET' | 'POST'): Promise<SubscribedAppsBody> {
    if (!config.businessAccountId || !config.accessToken) {
      throw new SubscriptionError(
        'Faltan WHATSAPP_BUSINESS_ACCOUNT_ID o WHATSAPP_ACCESS_TOKEN en server/.env',
      );
    }
    const response = await fetchImpl(url, { method, headers, signal: AbortSignal.timeout(10_000) });
    const body = (await response.json().catch(() => ({}))) as SubscribedAppsBody;
    if (!response.ok) {
      // Solo el mensaje de Meta; nunca el token.
      throw new SubscriptionError(body.error?.message ?? `Meta respondió HTTP ${response.status}`);
    }
    return body;
  }

  return {
    /** Apps suscritas hoy a la cuenta. */
    async list(): Promise<SubscribedApp[]> {
      const body = await call('GET');
      return (body.data ?? []).map((item) => ({
        id: item.whatsapp_business_api_data?.id ?? null,
        name: item.whatsapp_business_api_data?.name ?? null,
      }));
    },
    /** Suscribe la app dueña del token a la cuenta. */
    async subscribe(): Promise<void> {
      await call('POST');
    },
  };
}
