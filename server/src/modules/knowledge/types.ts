/** Días de la semana, de lunes a domingo (el orden en que se muestran). */
export const WEEK_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type WeekDay = (typeof WEEK_DAYS)[number];

/** Horario de un día: abierto de/hasta ("08:00"), "closed" (cerrado) o null (sin definir). */
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

/** Lo que Colibri sabe del negocio para contestar solo. Cada texto es null si está vacío. */
export interface BusinessKnowledge {
  hours: {
    days: Record<WeekDay, DayHours>;
    /** Feriados u horarios especiales, en texto libre. */
    notes: string | null;
  };
  location: {
    address: string | null;
    landmarks: string | null;
    /** Enlace de Waze o Google Maps. */
    mapsUrl: string | null;
  };
  payments: {
    /** Métodos de pago, por ejemplo "efectivo, tarjeta y SINPE Móvil". */
    methods: string | null;
    /** Número de SINPE Móvil (8 dígitos). */
    sinpeNumber: string | null;
    sinpeName: string | null;
    /** Precios o lista de productos. */
    prices: string | null;
  };
  shipping: string | null;
  availability: string | null;
  orders: string | null;
  /** Plantillas personalizadas por tema. Si un tema no tiene, se usa la de fábrica. */
  templates: Partial<Record<AutoTopic, string>>;
}

export const EMPTY_KNOWLEDGE: BusinessKnowledge = {
  hours: {
    days: { mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null },
    notes: null,
  },
  location: { address: null, landmarks: null, mapsUrl: null },
  payments: { methods: null, sinpeNumber: null, sinpeName: null, prices: null },
  shipping: null,
  availability: null,
  orders: null,
  templates: {},
};
