import { Router } from 'express';
import { HttpError } from '../../lib/httpError';
import type { ConversationService } from '../conversations/conversationService';
import type { IncomingMessage, StatusUpdate } from '../conversations/types';
import { isValidSignature } from '../whatsapp/whatsapp.signature';

/** Busca el nombre de quien escribe (null si no se pudo). */
export type ProfileLookup = (contactId: string) => Promise<string | null>;

/** Resultado de leer un webhook de Meta, ya traducido al formato de Colibri. */
export interface ParsedMetaWebhook {
  messages: IncomingMessage[];
  statuses: StatusUpdate[];
  /** Cuentas o páginas de eventos que se ignoraron por no ser la configurada. */
  ignoredAccountIds: string[];
  /** Eventos que no se pudieron leer (solo nombres de campos, sin contenido). */
  unreadable: string[];
}

export interface MetaWebhookOptions {
  /** Nombre para los mensajes de la consola, por ejemplo "Instagram". */
  label: string;
  /** Prefijo de las variables en server/.env, por ejemplo "INSTAGRAM". */
  envPrefix: string;
  /** Nombre de la variable con el ID de cuenta o página, por ejemplo "INSTAGRAM_ACCOUNT_ID". */
  accountVariable: string;
  isConfigured: boolean;
  verifyToken: string;
  appSecret: string;
  /** Si tiene valor, se ignoran los eventos de otras cuentas o páginas. */
  accountId: string;
  /** Imprime el cuerpo completo de cada evento (depuración; incluye el texto). */
  debugWebhook: boolean;
  parse: (body: unknown, accountId?: string) => ParsedMetaWebhook | null;
  explainInvalid: (body: unknown) => string;
  lookupName?: ProfileLookup;
}

/**
 * Webhook de un canal de Meta que usa el formato de Instagram y Messenger: verificación (GET),
 * firma HMAC (POST) y eventos en `entry[]`. WhatsApp tiene su propio formato y su propio router.
 */
export function createMetaWebhookRouter(
  options: MetaWebhookOptions,
  conversations: ConversationService,
): Router {
  const { label, envPrefix } = options;
  const lookupName = options.lookupName ?? (async () => null);
  const router = Router();

  router.use((_req, _res, next) => {
    if (!options.isConfigured) {
      throw new HttpError(503, 'CHANNEL_NOT_CONFIGURED', `${label} todavía no está configurado.`);
    }
    next();
  });

  // Verificación: Meta pregunta una sola vez si este servidor es el dueño de la URL.
  router.get('/', (req, res) => {
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
    if (mode === 'subscribe' && token === options.verifyToken && typeof challenge === 'string') {
      console.log(`${label} webhook: verificación correcta`);
      res.status(200).type('text/plain').send(challenge);
      return;
    }
    console.warn(
      `${label} webhook: verificación rechazada (el token no coincide con ${envPrefix}_VERIFY_TOKEN)`,
    );
    throw new HttpError(403, 'VERIFICATION_FAILED', 'El token de verificación no coincide.');
  });

  // Mensajes y estados. Solo se aceptan los firmados por Meta.
  router.post('/', async (req, res) => {
    const signature = req.get('x-hub-signature-256');
    if (!isValidSignature(req.rawBody, signature, options.appSecret)) {
      console.warn(
        `${label} webhook: firma inválida (revisa ${envPrefix}_APP_SECRET en server/.env)`,
      );
      throw new HttpError(401, 'INVALID_SIGNATURE', 'Firma inválida.');
    }

    if (options.debugWebhook) {
      // Solo el cuerpo (ya validada la firma); nunca encabezados ni secretos.
      console.log(`${label} webhook (cuerpo completo):\n${JSON.stringify(req.body, null, 2)}`);
    }

    const parsed = options.parse(req.body, options.accountId || undefined);
    if (!parsed) {
      console.log(
        `${label} webhook: evento con un formato que no usamos, se ignora (${options.explainInvalid(req.body)})`,
      );
    } else {
      console.log(
        `${label} webhook: ${parsed.messages.length} mensaje(s) y ${parsed.statuses.length} estado(s) recibidos`,
      );
      for (const fields of parsed.unreadable) {
        console.warn(
          `${label} webhook: un evento de mensajería no se pudo leer (campos: ${fields})`,
        );
      }
      for (const id of new Set(parsed.ignoredAccountIds)) {
        console.warn(
          `${label} webhook: evento ignorado: es de ${id} y ${options.accountVariable} es ${options.accountId}`,
        );
      }

      // Un solo nombre por persona y por envío, aunque haya varios mensajes seguidos.
      const names = new Map<string, string | null>();
      for (const message of parsed.messages) {
        if (!names.has(message.contactId)) {
          names.set(message.contactId, await lookupName(message.contactId));
        }
        await conversations.receive({
          ...message,
          contactName: names.get(message.contactId) ?? null,
        });
      }
      for (const status of parsed.statuses) await conversations.applyStatus(status);
    }

    // Siempre 200 si la firma es válida: así Meta no reintenta eventos que no nos interesan.
    res.sendStatus(200);
  });

  return router;
}
