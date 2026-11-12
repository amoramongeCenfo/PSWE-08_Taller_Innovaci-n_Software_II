import type { ConversationService, ReceivedText } from '../conversations/conversationService';
import type { ChannelId } from '../conversations/types';
import type { AlertsRepository } from './alertsRepository';
import type { CommentAnalysis, CommentAnalyzer } from './commentAnalyzer';
import { suggestedReplyFor } from './suggestedReplies';
import type { AlertSettings, ReputationAlert } from './types';

/** Dónde se muestra el mensaje en la tarjeta de la alerta. */
const SOURCE_LABEL: Record<ChannelId, string> = {
  whatsapp: 'Mensaje directo de WhatsApp',
  instagram: 'Mensaje directo de Instagram',
  messenger: 'Mensaje directo de Messenger',
};

/**
 * Una alerta se crea cuando el analizador detectó algo (confianza > 0) y el riesgo es medio o
 * alto. Con la sensibilidad "todo" también pasan las señales leves. La sensibilidad "grave" ya la
 * aplica el analizador, que devuelve confianza 0 para lo que no sea riesgo alto.
 */
export function shouldAlert(analysis: CommentAnalysis, settings: AlertSettings): boolean {
  if (analysis.confidence <= 0) return false;
  return analysis.risk !== 'bajo' || settings.sensitivity === 'todo';
}

export interface AlertDetectionOptions {
  /** Dónde se registra cada decisión (la consola por defecto). Nunca incluye el texto del cliente. */
  log?: (line: string) => void;
}

/**
 * Detección de alertas de reputación sobre los mensajes reales (etapa 5). Después de guardar cada
 * texto de una persona lo pasa por el analizador y, si hay riesgo, guarda la alerta con una
 * respuesta sugerida. Las alertas se leen desde /api/alerts.
 */
export class AlertDetectionService {
  private readonly log: (line: string) => void;

  constructor(
    private readonly conversations: ConversationService,
    private readonly alerts: AlertsRepository,
    private readonly analyzer: CommentAnalyzer,
    options: AlertDetectionOptions = {},
  ) {
    this.log = options.log ?? ((line) => console.log(line));
  }

  /** Empieza a escuchar los mensajes que llegan. */
  attach(): void {
    this.conversations.onReceivedText((event) => this.handle(event).then(() => undefined));
  }

  /** Analiza un mensaje y devuelve la alerta creada, o null si no hay riesgo que reportar. */
  async handle({ conversation, message }: ReceivedText): Promise<ReputationAlert | null> {
    const text = message.text ?? '';
    const settings = await this.alerts.getSettings();
    const analysis = await this.analyzer.analyze({
      text,
      channel: conversation.channel,
      keywords: settings.keywords,
      sensitivity: settings.sensitivity,
    });

    if (!shouldAlert(analysis, settings)) return null;

    const alert = await this.alerts.add({
      channel: conversation.channel,
      source: SOURCE_LABEL[conversation.channel],
      risk: analysis.risk,
      comment: {
        author: conversation.contactName ?? conversation.contactId,
        // En WhatsApp el identificador es el número; en Instagram y Messenger es un código interno.
        handle: conversation.channel === 'whatsapp' ? conversation.contactId : undefined,
        detail: 'Cliente',
        text,
        postedAt: message.createdAt,
      },
      thread: [],
      suggestedReply: suggestedReplyFor(analysis.category),
      postUrl: null,
    });
    this.log(
      `Alertas: riesgo ${analysis.risk} (${analysis.category}), confianza ${analysis.confidence.toFixed(2)}, canal ${conversation.channel}`,
    );
    return alert;
  }
}
