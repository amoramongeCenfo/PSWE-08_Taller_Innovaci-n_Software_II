/** Mismo contrato que el servidor (server/src/modules/knowledge/types.ts). */
export const WEEK_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type WeekDay = (typeof WEEK_DAYS)[number];

export const DAY_LABELS: Record<WeekDay, string> = {
  mon: 'Lunes',
  tue: 'Martes',
  wed: 'Miércoles',
  thu: 'Jueves',
  fri: 'Viernes',
  sat: 'Sábado',
  sun: 'Domingo',
};

/** Abierto de/hasta ("08:00"), "closed" (cerrado) o null (sin definir). */
export type DayHours = { open: string; close: string } | 'closed' | null;

/** Temas que Colibri puede contestar solo. Los reclamos nunca se contestan solos. */
export const AUTO_TOPICS = [
  'hours',
  'location',
  'pricing',
  'availability',
  'shipping',
  'orders',
] as const;
export type AutoTopic = (typeof AUTO_TOPICS)[number];

export interface BusinessKnowledge {
  hours: { days: Record<WeekDay, DayHours>; notes: string | null };
  location: { address: string | null; landmarks: string | null; mapsUrl: string | null };
  payments: {
    methods: string | null;
    sinpeNumber: string | null;
    sinpeName: string | null;
    prices: string | null;
  };
  shipping: string | null;
  availability: string | null;
  orders: string | null;
  /** Plantillas personalizadas. Si un tema no tiene, se usa la de fábrica. */
  templates: Partial<Record<AutoTopic, string>>;
}

/** Resultado de armar una respuesta con una plantilla. */
export interface RenderResult {
  text: string;
  /** Datos obligatorios vacíos (por ejemplo "Dirección"). */
  missing: string[];
  /** Variables que no existen. */
  unknown: string[];
  /** true si se puede enviar tal cual. */
  ready: boolean;
}

export interface TemplateVariable {
  name: string;
  label: string;
  optional: boolean;
}

export interface TopicStatus {
  template: string;
  defaultTemplate: string;
  custom: boolean;
  variables: TemplateVariable[];
  preview: RenderResult;
}

/** GET /api/knowledge */
export interface KnowledgeView {
  knowledge: BusinessKnowledge;
  topics: Record<AutoTopic, TopicStatus>;
}

export type KnowledgeStatus = 'idle' | 'loading' | 'ready' | 'error';

/** Límites iguales a los del servidor. */
export const KNOWLEDGE_LIMITS = {
  shortText: 200,
  longText: 800,
  url: 300,
  template: 1000,
} as const;
