import { Router } from 'express';
import { z } from 'zod';
import { HttpError } from '../../lib/httpError';
import type { ConversationService } from './conversationService';

/** Límite de WhatsApp para un mensaje de texto. */
const MAX_TEXT_LENGTH = 4096;

/** Periodo de las estadísticas del panel: la última semana. */
const STATS_DAYS = 7;

const replySchema = z.object({
  text: z.string().trim().min(1).max(MAX_TEXT_LENGTH),
});

export function createConversationRouter(service: ConversationService): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    res.json(await service.list());
  });

  // Debe ir antes de las rutas con :id.
  router.get('/stats', async (_req, res) => {
    const days = STATS_DAYS;
    const [responseTime, autoReplies] = await Promise.all([
      service.responseTime(days),
      service.autoReplies(days),
    ]);
    res.json({ days, responseTime, autoReplies });
  });

  router.get('/:id/messages', async (req, res) => {
    res.json(await service.listMessages(req.params.id));
  });

  router.post('/:id/messages', async (req, res) => {
    const body = replySchema.safeParse(req.body);
    if (!body.success) {
      throw new HttpError(
        400,
        'INVALID_MESSAGE',
        `Escribe un mensaje de 1 a ${MAX_TEXT_LENGTH} caracteres.`,
      );
    }
    res.status(201).json(await service.reply(req.params.id, body.data.text));
  });

  return router;
}
