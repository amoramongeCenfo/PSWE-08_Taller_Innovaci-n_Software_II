import type { Tone, Treatment } from './types';

export const TONE_OPTIONS: { value: Tone; title: string; description: string; icon: string }[] = [
  {
    value: 'cercano',
    title: 'Cercano',
    description: 'Cálido y amable, como quien atiende en el mostrador.',
    icon: 'sentiment_satisfied',
  },
  {
    value: 'profesional',
    title: 'Profesional',
    description: 'Cortés y ordenado, ideal para servicios y consultorios.',
    icon: 'business_center',
  },
  {
    value: 'breve',
    title: 'Breve',
    description: 'Va al grano: la respuesta en una o dos líneas.',
    icon: 'bolt',
  },
];

export const TREATMENT_OPTIONS: { value: Treatment; label: string; example: string }[] = [
  { value: 'usted', label: 'Usted', example: '¿Le guardamos su pedido?' },
  { value: 'tu', label: 'Tú', example: '¿Quieres que te guardemos el pedido?' },
  { value: 'vos', label: 'Vos', example: '¿Querés que te guardemos el pedido?' },
];

const GREETING: Record<Tone, string> = {
  cercano: '¡Hola! Qué gusto saludarle.',
  profesional: 'Buen día, gracias por escribirnos.',
  breve: 'Hola.',
};

/** Frase según el trato: el horario de ejemplo es solo para la vista previa. */
const BODY: Record<Treatment, Record<Tone, string>> = {
  usted: {
    cercano: 'Hoy abrimos de 8 a. m. a 6 p. m. Si gusta, le guardamos su pedido.',
    profesional: 'Nuestro horario de hoy es de 8:00 a. m. a 6:00 p. m. Quedamos a sus órdenes.',
    breve: 'Hoy abrimos de 8 a. m. a 6 p. m.',
  },
  tu: {
    cercano: 'Hoy abrimos de 8 a. m. a 6 p. m. Si quieres, te guardamos tu pedido.',
    profesional: 'Nuestro horario de hoy es de 8:00 a. m. a 6:00 p. m. Quedamos atentos.',
    breve: 'Hoy abrimos de 8 a. m. a 6 p. m.',
  },
  vos: {
    cercano: 'Hoy abrimos de 8 a. m. a 6 p. m. Si querés, te guardamos tu pedido.',
    profesional: 'Nuestro horario de hoy es de 8:00 a. m. a 6:00 p. m. Quedamos atentos.',
    breve: 'Hoy abrimos de 8 a. m. a 6 p. m.',
  },
};

/** Respuesta de ejemplo para la vista previa de "Cómo habla tu negocio". */
export function buildSampleReply(tone: Tone, treatment: Treatment, signature: string | null) {
  const greeting =
    tone === 'cercano' && treatment !== 'usted' ? '¡Hola! Qué gusto saludarte.' : GREETING[tone];
  const parts = [greeting, BODY[treatment][tone]];
  if (signature?.trim()) parts.push(`— ${signature.trim()}`);
  return parts.join(' ');
}
