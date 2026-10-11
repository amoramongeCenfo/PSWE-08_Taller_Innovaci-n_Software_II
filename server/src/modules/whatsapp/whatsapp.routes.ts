import { Router } from 'express';
import { canReceiveWhatsApp, type WhatsAppConfig } from '../../config';
import { HttpError } from '../../lib/httpError';
import type { ConversationService } from '../conversations/conversationService';
import { isValidSignature } from './whatsapp.signature';
import { parseWebhook } from './whatsapp.mapper';

/** Rutas que llama Meta. Se montan en /api/webhooks/whatsapp. */
export function createWhatsAppRouter(config: WhatsAppConfig, conversations: ConversationService) {
  const router = Router();

  router.use((_req, _res, next) => {
    if (!canReceiveWhatsApp(config)) {
      throw new HttpError(503, 'CHANNEL_NOT_CONFIGURED', 'WhatsApp todavía no está configurado.');
    }
    next();
  });

  // Verificación: Meta pregunta una sola vez si este servidor es el dueño de la URL.
  router.get('/', (req, res) => {
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
    if (mode === 'subscribe' && token === config.verifyToken && typeof challenge === 'string') {
      console.log('WhatsApp webhook: verificación correcta');
      res.status(200).type('text/plain').send(challenge);
      return;
    }
    console.warn(
      'WhatsApp webhook: verificación rechazada (el token no coincide con WHATSAPP_VERIFY_TOKEN)',
    );
    throw new HttpError(403, 'VERIFICATION_FAILED', 'El token de verificación no coincide.');
  });

  // Mensajes y estados de entrega. Solo se aceptan los firmados por Meta.
  router.post('/', async (req, res) => {
    const signature = req.get('x-hub-signature-256');
    if (!isValidSignature(req.rawBody, signature, config.appSecret)) {
      console.warn('WhatsApp webhook: firma inválida (revisa WHATSAPP_APP_SECRET en server/.env)');
      throw new HttpError(401, 'INVALID_SIGNATURE', 'Firma inválida.');
    }

    const parsed = parseWebhook(req.body, config.phoneNumberId || undefined);
    if (!parsed) {
      console.log('WhatsApp webhook: evento con un formato que no usamos, se ignora');
    } else {
      console.log(
        `WhatsApp webhook: ${parsed.messages.length} mensaje(s) y ${parsed.statuses.length} estado(s) recibidos`,
      );
      for (const id of new Set(parsed.ignoredPhoneNumberIds)) {
        console.warn(
          `WhatsApp webhook: evento ignorado: es del número ${id} y WHATSAPP_PHONE_NUMBER_ID es ${config.phoneNumberId}`,
        );
      }
      for (const message of parsed.messages) await conversations.receive(message);
      for (const status of parsed.statuses) await conversations.applyStatus(status);
    }

    // Siempre 200 si la firma es válida: así Meta no reintenta eventos que no nos interesan.
    res.sendStatus(200);
  });

  return router;
}
