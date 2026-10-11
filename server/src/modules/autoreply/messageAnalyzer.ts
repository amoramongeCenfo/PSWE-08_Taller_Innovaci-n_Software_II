import type { TopicId } from '../assistant/types';
import type { ChannelId } from '../conversations/types';

/**
 * Contrato del analizador de mensajes. Lo implementa el área de análisis; el motor "Contesta solo"
 * solo depende de esta interfaz. Guía: docs/analizador-de-mensajes.md.
 */
export interface MessageAnalysis {
  /** Tema reconocido, o null si el mensaje no corresponde a ninguno. */
  topic: TopicId | null;
  /** Qué tan seguro está el analizador, de 0 a 1. */
  confidence: number;
  /** true si el mensaje toca uno de los temas que Colibri nunca debe contestar. */
  blocked: boolean;
}

export interface MessageAnalysisInput {
  text: string;
  channel: ChannelId;
  /** Temas prohibidos que escribió el negocio (Mi negocio › Temas que Colibri nunca debe contestar). */
  blockedTopics: string[];
}

export interface MessageAnalyzer {
  analyze(input: MessageAnalysisInput): Promise<MessageAnalysis>;
}
