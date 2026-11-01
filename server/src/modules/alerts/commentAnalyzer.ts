import type { ChannelId } from '../conversations/types';

/**
 * Contrato del analizador de comentarios públicos. Lo implementa el área de análisis; el motor
 * de alertas de reputación (etapa 5) solo depende de esta interfaz.
 *
 * Sigue el mismo patrón que `MessageAnalyzer` (autoreply): cualquier implementación nueva debe
 * pasar `describeCommentAnalyzer` antes de conectarse al servicio.
 */

/** Nivel de riesgo que el analizador asigna a un comentario público. */
export type CommentRisk = 'alto' | 'medio' | 'bajo';

/**
 * Categoría del comentario delicado.
 * - estafa   : acusación de fraude o engaño
 * - salud    : riesgo de intoxicación u otro daño físico
 * - calidad  : producto defectuoso o servicio deficiente
 * - atencion : mal trato o ignorar mensajes del cliente
 * - otro     : disparo por palabra clave del negocio u otro motivo
 */
export type CommentCategory = 'estafa' | 'salud' | 'calidad' | 'atencion' | 'otro';

export interface CommentAnalysis {
  risk: CommentRisk;
  /** Qué tan seguro está el analizador, de 0 a 1. 0 significa sin riesgo detectado. */
  confidence: number;
  /** Palabras o frases del texto que dispararon la alerta. */
  triggers: string[];
  category: CommentCategory;
}

export interface CommentAnalysisInput {
  text: string;
  channel: ChannelId;
  /** Palabras configuradas por el negocio que generan alerta inmediata. */
  keywords: string[];
  /** Sensibilidad del sistema: 'grave' solo detecta riesgo alto; 'todo' detecta cualquier señal. */
  sensitivity: 'grave' | 'normal' | 'todo';
}

export interface CommentAnalyzer {
  analyze(input: CommentAnalysisInput): Promise<CommentAnalysis>;
}
