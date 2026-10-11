/** Mismo contrato que el servidor (server/src/modules/assistant/types.ts). */
export const TOPIC_IDS = [
  'hours',
  'location',
  'pricing',
  'availability',
  'shipping',
  'orders',
  'complaints',
] as const;
export type TopicId = (typeof TOPIC_IDS)[number];

/** auto: contesta solo · ask: te pregunta antes · never: nunca contesta. */
export type ReplyMode = 'auto' | 'ask' | 'never';
export type Tone = 'cercano' | 'profesional' | 'breve';
export type Treatment = 'usted' | 'tu' | 'vos';

export interface AssistantSettings {
  rules: Record<TopicId, ReplyMode>;
  blockedTopics: string[];
  tone: Tone;
  treatment: Treatment;
  signature: string | null;
  /** Interruptor general: si es true, Colibri no contesta solo ninguna consulta. */
  autoReplyPaused: boolean;
  /** null mientras la bienvenida no se haya completado. */
  onboardingCompletedAt: string | null;
}

/** Lo que se edita desde la bienvenida o desde Mi negocio. */
export type AssistantSettingsInput = Omit<AssistantSettings, 'onboardingCompletedAt'>;

export type AssistantStatus = 'idle' | 'loading' | 'ready' | 'error';

/** Límites iguales a los del servidor. */
export const ASSISTANT_LIMITS = { topicLength: 60, maxTopics: 20, signature: 120 } as const;
