import { Router } from 'express';
import { z } from 'zod';
import { HttpError } from '../../lib/httpError';
import type { ReplyComposer } from '../autoreply/replyComposer';
import { findUnknownVariables, MAX_REPLY_LENGTH } from '../autoreply/templates';
import type { KnowledgeRepository } from './knowledgeRepository';
import { AUTO_TOPICS, WEEK_DAYS, type BusinessKnowledge } from './types';

/** Límites compartidos con el cliente (features/knowledge). */
export const KNOWLEDGE_LIMITS = {
  shortText: 200,
  longText: 800,
  url: 300,
  template: MAX_REPLY_LENGTH,
} as const;

/** Texto opcional: recorta espacios y guarda null si queda vacío. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((value) => value || null);

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

const dayHours = z.union([
  z.literal('closed'),
  z.null(),
  z
    .object({ open: time, close: time })
    .refine(({ open, close }) => close > open, { message: 'La hora de cierre va después.' }),
]);

const template = z
  .string()
  .trim()
  .max(KNOWLEDGE_LIMITS.template)
  .refine((value) => findUnknownVariables(value).length === 0, {
    message: 'La plantilla usa un dato que no existe.',
  });

const knowledgeSchema = z.object({
  hours: z.object({
    days: z.record(z.enum(WEEK_DAYS), dayHours),
    notes: optionalText(KNOWLEDGE_LIMITS.shortText),
  }),
  location: z.object({
    address: optionalText(KNOWLEDGE_LIMITS.shortText),
    landmarks: optionalText(KNOWLEDGE_LIMITS.shortText),
    mapsUrl: optionalText(KNOWLEDGE_LIMITS.url).refine(
      (value) => value === null || /^https:\/\/\S+$/.test(value),
      { message: 'El enlace debe empezar con https://' },
    ),
  }),
  payments: z.object({
    methods: optionalText(KNOWLEDGE_LIMITS.shortText),
    // Se aceptan espacios o guiones ("8888-7777"); se guardan solo los 8 dígitos.
    sinpeNumber: optionalText(20)
      .transform((value) => value?.replace(/[\s-]/g, '') || null)
      .refine((value) => value === null || /^\d{8}$/.test(value), {
        message: 'El número de SINPE Móvil tiene 8 dígitos.',
      }),
    sinpeName: optionalText(KNOWLEDGE_LIMITS.shortText),
    prices: optionalText(KNOWLEDGE_LIMITS.longText),
  }),
  shipping: optionalText(KNOWLEDGE_LIMITS.longText),
  availability: optionalText(KNOWLEDGE_LIMITS.longText),
  orders: optionalText(KNOWLEDGE_LIMITS.longText),
  // Una plantilla vacía significa "usar la de fábrica": no se guarda.
  templates: z
    .partialRecord(z.enum(AUTO_TOPICS), template)
    .transform((templates) =>
      Object.fromEntries(Object.entries(templates).filter(([, value]) => value)),
    ),
});

const previewSchema = z.object({
  template: z.string().max(KNOWLEDGE_LIMITS.template * 2),
  /**
   * Borrador sin guardar; si no viene, se usa lo guardado. Sus plantillas no se validan: la que se
   * está escribiendo puede tener un dato inventado y la vista previa debe señalarlo, no fallar.
   */
  knowledge: knowledgeSchema
    .extend({ templates: z.record(z.string(), z.string().max(KNOWLEDGE_LIMITS.template)) })
    .optional(),
});

function parseKnowledge(body: unknown): BusinessKnowledge {
  const parsed = knowledgeSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.find((issue) => issue.code === 'custom')?.message;
    throw new HttpError(400, 'INVALID_REQUEST', message ?? 'Revisa la información del negocio.');
  }
  return parsed.data as BusinessKnowledge;
}

/**
 * GET /api/knowledge: lo que Colibri sabe del negocio y cómo queda la respuesta de cada tema.
 * PUT /api/knowledge: guarda todo junto. POST /api/knowledge/preview: prueba una plantilla.
 */
export function createKnowledgeRouter(
  repository: KnowledgeRepository,
  composer: ReplyComposer,
): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    res.json(await composer.view());
  });

  router.put('/', async (req, res) => {
    const saved = await repository.save(parseKnowledge(req.body));
    res.json(await composer.view(saved));
  });

  router.post('/preview', async (req, res) => {
    const body = previewSchema.safeParse(req.body);
    if (!body.success) {
      throw new HttpError(400, 'INVALID_REQUEST', 'Revisa la plantilla.');
    }
    const knowledge = body.data.knowledge as BusinessKnowledge | undefined;
    res.json(await composer.preview(body.data.template, knowledge));
  });

  return router;
}
