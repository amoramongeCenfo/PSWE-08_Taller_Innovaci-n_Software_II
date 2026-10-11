import { Router } from 'express';
import { z } from 'zod';
import { HttpError } from '../../lib/httpError';
import type { AssistantRepository } from './assistantRepository';
import { REPLY_MODES, TONES, TOPIC_IDS, TREATMENTS, withDefaultRules } from './types';

/** Límites compartidos con el cliente (features/assistant). */
export const ASSISTANT_LIMITS = { topicLength: 60, maxTopics: 20, signature: 120 } as const;

const settingsSchema = z.object({
  rules: z.partialRecord(z.enum(TOPIC_IDS), z.enum(REPLY_MODES)),
  blockedTopics: z
    .array(z.string().trim().min(1).max(ASSISTANT_LIMITS.topicLength))
    .max(ASSISTANT_LIMITS.maxTopics)
    // Sin repetidos (sin importar mayúsculas).
    .transform((topics) =>
      topics.filter(
        (topic, i) => topics.findIndex((t) => t.toLowerCase() === topic.toLowerCase()) === i,
      ),
    ),
  tone: z.enum(TONES),
  treatment: z.enum(TREATMENTS),
  signature: z
    .string()
    .trim()
    .max(ASSISTANT_LIMITS.signature)
    .nullable()
    .transform((value) => value || null),
  autoReplyPaused: z.boolean(),
  /** true al terminar la bienvenida. */
  completeOnboarding: z.boolean().default(false),
});

/**
 * GET /api/assistant: cómo atiende Colibri (reglas, temas prohibidos, tono) y si la bienvenida
 * ya se completó. PUT /api/assistant: guarda todo junto.
 */
export function createAssistantRouter(
  repository: AssistantRepository,
  now: () => Date = () => new Date(),
): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    res.json(await repository.get());
  });

  router.put('/', async (req, res) => {
    const body = settingsSchema.safeParse(req.body);
    if (!body.success) {
      throw new HttpError(400, 'INVALID_REQUEST', 'Revisa los ajustes del asistente.');
    }
    const { completeOnboarding, rules, ...rest } = body.data;
    const saved = await repository.save(
      { ...rest, rules: withDefaultRules(rules) },
      completeOnboarding ? now().toISOString() : null,
    );
    res.json(saved);
  });

  return router;
}
