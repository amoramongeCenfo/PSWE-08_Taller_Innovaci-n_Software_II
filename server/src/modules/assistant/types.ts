/** Consultas comunes que Colibri puede atender. El orden es el de la pantalla. */
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

/** auto: contesta solo · ask: le pregunta a la persona antes · never: nunca contesta. */
export const REPLY_MODES = ['auto', 'ask', 'never'] as const;
export type ReplyMode = (typeof REPLY_MODES)[number];

/** Estilo de las respuestas. */
export const TONES = ['cercano', 'profesional', 'breve'] as const;
export type Tone = (typeof TONES)[number];

/** Cómo se trata al cliente. */
export const TREATMENTS = ['usted', 'tu', 'vos'] as const;
export type Treatment = (typeof TREATMENTS)[number];

export interface AssistantSettings {
  rules: Record<TopicId, ReplyMode>;
  /** Temas que Colibri nunca debe contestar: avisa a la persona. */
  blockedTopics: string[];
  tone: Tone;
  treatment: Treatment;
  /** Firma o despedida opcional al final de las respuestas. */
  signature: string | null;
  /** Interruptor general: si es true, Colibri no contesta solo ninguna consulta. */
  autoReplyPaused: boolean;
  /** Cuándo se terminó la bienvenida; null si nunca se completó. */
  onboardingCompletedAt: string | null;
}

/** Lo que se edita desde la bienvenida o desde Configuración. */
export type AssistantSettingsInput = Omit<AssistantSettings, 'onboardingCompletedAt'>;

/** Valores iniciales: lo seguro contesta solo; lo que depende del día, pregunta primero. */
export const DEFAULT_SETTINGS: AssistantSettings = {
  rules: {
    hours: 'auto',
    location: 'auto',
    pricing: 'auto',
    availability: 'ask',
    shipping: 'ask',
    orders: 'ask',
    complaints: 'ask',
  },
  blockedTopics: [],
  tone: 'cercano',
  treatment: 'usted',
  signature: null,
  autoReplyPaused: false,
  onboardingCompletedAt: null,
};

/** Une reglas guardadas con las de fábrica: si se agrega una consulta nueva, toma su valor inicial. */
export function withDefaultRules(
  rules: Partial<Record<string, unknown>>,
): Record<TopicId, ReplyMode> {
  const result = { ...DEFAULT_SETTINGS.rules };
  for (const topic of TOPIC_IDS) {
    const mode = rules[topic];
    if (typeof mode === 'string' && (REPLY_MODES as readonly string[]).includes(mode)) {
      result[topic] = mode as ReplyMode;
    }
  }
  return result;
}
