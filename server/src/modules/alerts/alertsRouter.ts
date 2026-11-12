import { Router } from 'express';
import { z } from 'zod';
import { HttpError } from '../../lib/httpError';
import type { AlertsRepository } from './alertsRepository';
import { BasicCommentAnalyzer } from './basicCommentAnalyzer';
import type { CommentAnalyzer } from './commentAnalyzer';

/**
 * Rutas de alertas de reputación (etapa 5).
 *
 * Endpoints:
 *   GET    /api/alerts             Alertas activas (estado "nueva")
 *   GET    /api/alerts/historial   Alertas atendidas
 *   GET    /api/alerts/settings    Configuración actual
 *   PATCH  /api/alerts/settings    Actualiza sensibilidad, palabras clave o notificación WhatsApp
 *   POST   /api/alerts/:id/atender Marca una alerta como atendida
 *   POST   /api/alerts/analyze     Analiza un texto y devuelve su nivel de riesgo (útil para pruebas)
 *
 * El analizador se inyecta (ver `createCommentAnalyzer`): por defecto el de palabras clave, o el de
 * IA si hay un LLM configurado. Así la ruta no depende del proveedor.
 */

const analyzeSchema = z.object({
  text: z.string().min(1).max(5000),
  channel: z.enum(['whatsapp', 'instagram', 'messenger']),
});

const settingsSchema = z.object({
  sensitivity: z.enum(['grave', 'normal', 'todo']).optional(),
  keywords: z.array(z.string().min(1).max(100)).max(50).optional(),
  notifyByWhatsApp: z.boolean().optional(),
  whatsAppNumber: z.string().nullable().optional(),
});

export function createAlertsRouter(
  repository: AlertsRepository,
  analyzer: CommentAnalyzer = new BasicCommentAnalyzer(),
): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    res.json(await repository.list('nueva'));
  });

  router.get('/historial', async (_req, res) => {
    res.json(await repository.list('atendida'));
  });

  router.get('/settings', async (_req, res) => {
    res.json(await repository.getSettings());
  });

  router.patch('/settings', async (req, res) => {
    const body = settingsSchema.safeParse(req.body);
    if (!body.success) {
      throw new HttpError(400, 'INVALID_SETTINGS', 'Los ajustes enviados no son válidos.');
    }
    res.json(await repository.saveSettings(body.data));
  });

  router.post('/:id/atender', async (req, res) => {
    await repository.markAttended(req.params.id);
    res.json({ ok: true });
  });

  router.post('/analyze', async (req, res) => {
    const body = analyzeSchema.safeParse(req.body);
    if (!body.success) {
      throw new HttpError(400, 'INVALID_INPUT', 'Texto o canal no válidos.');
    }
    const settings = await repository.getSettings();
    const result = await analyzer.analyze({
      text: body.data.text,
      channel: body.data.channel,
      keywords: settings.keywords,
      sensitivity: settings.sensitivity,
    });
    res.json(result);
  });

  return router;
}
