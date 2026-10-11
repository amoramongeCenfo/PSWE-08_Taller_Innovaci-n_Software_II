import type { Tone, Treatment } from '../assistant/types';
import type { AutoTopic, BusinessKnowledge } from '../knowledge/types';
import { describeToday, describeWeek, localTime } from './hours';

/** Largo máximo de una respuesta: el límite más estricto de los canales (Instagram). */
export const MAX_REPLY_LENGTH = 1000;

/** Con qué se arma cada respuesta. */
export interface TemplateContext {
  knowledge: BusinessKnowledge;
  tone: Tone;
  treatment: Treatment;
  signature: string | null;
  businessName: string | null;
  now: Date;
  timeZone: string;
}

interface VariableDefinition {
  /** Texto para la pantalla. */
  label: string;
  /** Opcional: si está vacía, se omite sin impedir la respuesta. */
  optional: boolean;
  value: (ctx: TemplateContext) => string | null;
}

const text = (value: string | null | undefined) => value?.trim() || null;

function greeting(ctx: TemplateContext): string {
  if (ctx.tone === 'breve') return '¡Hola!';
  if (ctx.tone === 'profesional') {
    const hour = Math.floor(localTime(ctx.now, ctx.timeZone).minutes / 60);
    const part = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
    return `${part}, gracias por escribirnos.`;
  }
  return ctx.treatment === 'usted' ? '¡Hola! Con gusto le ayudo.' : '¡Hola! Con gusto te ayudo.';
}

function formatSinpe(ctx: TemplateContext): string | null {
  const digits = ctx.knowledge.payments.sinpeNumber?.replace(/\D/g, '');
  if (!digits) return null;
  const number = digits.length === 8 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits;
  const name = text(ctx.knowledge.payments.sinpeName);
  return `SINPE Móvil: ${number}${name ? ` a nombre de ${name}` : ''}.`;
}

/** Variables que se pueden usar en las plantillas, por ejemplo `{horario_hoy}`. */
export const TEMPLATE_VARIABLES = {
  saludo: { label: 'Saludo', optional: true, value: greeting },
  firma: {
    label: 'Firma',
    optional: true,
    value: (ctx) => (text(ctx.signature) ? `— ${text(ctx.signature)}` : null),
  },
  nombre_negocio: {
    label: 'Nombre del negocio',
    optional: false,
    value: (ctx) => text(ctx.businessName),
  },
  horario_hoy: {
    label: 'Horario de hoy',
    optional: false,
    value: (ctx) => describeToday(ctx.knowledge, ctx.now, ctx.timeZone),
  },
  horario_semana: {
    label: 'Horario de la semana',
    optional: false,
    value: (ctx) => describeWeek(ctx.knowledge),
  },
  notas_horario: {
    label: 'Feriados y horarios especiales',
    optional: true,
    value: (ctx) => text(ctx.knowledge.hours.notes),
  },
  direccion: {
    label: 'Dirección',
    optional: false,
    value: (ctx) => text(ctx.knowledge.location.address),
  },
  senas: {
    label: 'Señas',
    optional: true,
    value: (ctx) =>
      text(ctx.knowledge.location.landmarks)
        ? `Señas: ${text(ctx.knowledge.location.landmarks)}.`
        : null,
  },
  mapa: {
    label: 'Enlace al mapa',
    optional: true,
    value: (ctx) =>
      text(ctx.knowledge.location.mapsUrl)
        ? `Ubicación: ${text(ctx.knowledge.location.mapsUrl)}`
        : null,
  },
  precios: {
    label: 'Precios',
    optional: false,
    value: (ctx) => text(ctx.knowledge.payments.prices),
  },
  metodos_pago: {
    label: 'Métodos de pago',
    optional: true,
    value: (ctx) =>
      text(ctx.knowledge.payments.methods)
        ? `Aceptamos ${text(ctx.knowledge.payments.methods)}.`
        : null,
  },
  sinpe: { label: 'SINPE Móvil', optional: true, value: formatSinpe },
  envios: { label: 'Envíos', optional: false, value: (ctx) => text(ctx.knowledge.shipping) },
  disponibilidad: {
    label: 'Disponibilidad',
    optional: false,
    value: (ctx) => text(ctx.knowledge.availability),
  },
  encargos: { label: 'Encargos', optional: false, value: (ctx) => text(ctx.knowledge.orders) },
} satisfies Record<string, VariableDefinition>;

export type TemplateVariable = keyof typeof TEMPLATE_VARIABLES;
const VARIABLES = TEMPLATE_VARIABLES as Record<string, VariableDefinition>;

/** Variables que tienen sentido en cada tema (las que la pantalla ofrece como botones). */
export const TOPIC_VARIABLES: Record<AutoTopic, TemplateVariable[]> = {
  hours: ['saludo', 'horario_hoy', 'horario_semana', 'notas_horario', 'nombre_negocio', 'firma'],
  location: ['saludo', 'direccion', 'senas', 'mapa', 'nombre_negocio', 'firma'],
  pricing: ['saludo', 'precios', 'metodos_pago', 'sinpe', 'nombre_negocio', 'firma'],
  availability: ['saludo', 'disponibilidad', 'nombre_negocio', 'firma'],
  shipping: ['saludo', 'envios', 'nombre_negocio', 'firma'],
  orders: ['saludo', 'encargos', 'nombre_negocio', 'firma'],
};

/** Plantilla de fábrica según el tema, el tono y el trato. */
export function defaultTemplate(topic: AutoTopic, tone: Tone, treatment: Treatment): string {
  const weWait = treatment === 'usted' ? '¡Le esperamos!' : '¡Te esperamos!';
  const anything = 'Cualquier consulta, aquí estamos.';
  const brief = tone === 'breve';
  switch (topic) {
    case 'hours':
      return brief
        ? '{horario_hoy} {firma}'
        : `{saludo} {horario_hoy} Nuestro horario: {horario_semana}. {notas_horario}${tone === 'cercano' ? ` ${weWait}` : ''} {firma}`;
    case 'location':
      return brief
        ? 'Estamos en {direccion}. {mapa} {firma}'
        : `{saludo} Estamos en {direccion}. {senas} {mapa}${tone === 'cercano' ? ` ${weWait}` : ''} {firma}`;
    case 'pricing':
      return brief
        ? '{precios} {sinpe} {firma}'
        : `{saludo} {precios} {metodos_pago} {sinpe} ${anything} {firma}`;
    case 'availability':
      return brief ? '{disponibilidad} {firma}' : `{saludo} {disponibilidad} ${anything} {firma}`;
    case 'shipping':
      return brief ? '{envios} {firma}' : `{saludo} {envios} ${anything} {firma}`;
    case 'orders':
      return brief ? '{encargos} {firma}' : `{saludo} {encargos} ${anything} {firma}`;
  }
}

const VARIABLE_PATTERN = /\{([a-z_]+)\}/g;

/** Variables que la plantilla usa y que no existen (para avisar antes de guardar). */
export function findUnknownVariables(template: string): string[] {
  const unknown = new Set<string>();
  for (const [, name] of template.matchAll(VARIABLE_PATTERN)) {
    if (!(name! in VARIABLES)) unknown.add(name!);
  }
  return [...unknown];
}

export interface RenderResult {
  text: string;
  /** Datos obligatorios vacíos (por ejemplo "Dirección"): con alguno, no se envía. */
  missing: string[];
  /** Variables que no existen. */
  unknown: string[];
  /** true si la respuesta se puede enviar tal cual. */
  ready: boolean;
}

/** Arma el texto final y dice si se puede enviar. Las variables opcionales vacías desaparecen. */
export function renderTemplate(template: string, ctx: TemplateContext): RenderResult {
  const missing = new Set<string>();
  const unknown = new Set<string>();
  const rendered = template.replace(VARIABLE_PATTERN, (match, name: string) => {
    const variable = VARIABLES[name];
    if (!variable) {
      unknown.add(name);
      return match;
    }
    const value = variable.value(ctx);
    if (value === null) {
      if (!variable.optional) missing.add(variable.label);
      return '';
    }
    return value;
  });
  const clean = rendered
    .replace(/[ \t]+/g, ' ')
    .replace(/ +([.,;:!?])/g, '$1')
    .replace(/(m)\.\./g, '$1.')
    .replace(/ *\n */g, '\n')
    .trim();
  return {
    text: clean,
    missing: [...missing],
    unknown: [...unknown],
    ready:
      missing.size === 0 &&
      unknown.size === 0 &&
      clean.length > 0 &&
      clean.length <= MAX_REPLY_LENGTH,
  };
}

/** Plantilla que se usa en un tema: la personalizada o la de fábrica. */
export function templateFor(
  topic: AutoTopic,
  ctx: TemplateContext,
): { template: string; custom: boolean } {
  const custom = ctx.knowledge.templates[topic]?.trim();
  return custom
    ? { template: custom, custom: true }
    : { template: defaultTemplate(topic, ctx.tone, ctx.treatment), custom: false };
}
