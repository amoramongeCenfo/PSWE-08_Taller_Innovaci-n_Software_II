import type { CommentCategory } from './commentAnalyzer';
import type { SuggestedReply } from './types';

/**
 * Respuestas sugeridas para una alerta, según la categoría del comentario. Son plantillas
 * conciliadoras: la persona del negocio siempre las revisa y las envía (o no) ella misma.
 */
const REPLIES: Record<CommentCategory, SuggestedReply> = {
  estafa: {
    title: 'Colibri preparó esta respuesta con tono conciliador',
    text: 'Hola, lamentamos muchísimo que se sienta así. Queremos revisar su caso de inmediato: ¿nos comparte los datos de su compra para verificarla y darle una solución hoy mismo?',
  },
  salud: {
    title: 'Colibri preparó esta respuesta con tono de urgencia',
    text: 'Hola, nos preocupa mucho lo que nos cuenta. Lo primero es su bienestar: ¿se encuentra bien? Escríbanos por privado para saber qué producto fue y atender su caso de inmediato.',
  },
  calidad: {
    title: 'Colibri preparó esta respuesta con tono conciliador',
    text: 'Hola, qué pena que su producto no haya llegado como esperaba. Queremos corregirlo: ¿nos puede escribir por privado con su pedido y, si puede, una foto? Le reponemos o resolvemos lo antes posible.',
  },
  atencion: {
    title: 'Colibri preparó esta respuesta con tono conciliador',
    text: 'Hola, le pedimos disculpas por la atención que recibió. Ya estamos revisando qué pasó con su mensaje y le escribimos por privado para atenderle como se merece.',
  },
  otro: {
    title: 'Colibri preparó esta respuesta',
    text: 'Hola, gracias por escribirnos y por avisarnos. Queremos entender mejor lo que pasó: ¿nos cuenta más por privado para ayudarle cuanto antes?',
  },
};

export function suggestedReplyFor(category: CommentCategory): SuggestedReply {
  return { ...REPLIES[category] };
}
