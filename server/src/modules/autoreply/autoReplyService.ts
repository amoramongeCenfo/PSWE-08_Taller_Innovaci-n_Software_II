import { HttpError } from '../../lib/httpError';
import type { AssistantRepository } from '../assistant/assistantRepository';
import type { TopicId } from '../assistant/types';
import type { ConversationService, ReceivedText } from '../conversations/conversationService';
import { AUTO_TOPICS, type AutoTopic } from '../knowledge/types';
import type { MessageAnalyzer } from './messageAnalyzer';
import type { ReplyComposer } from './replyComposer';

/** Por qué Colibri no contestó solo. Se registra en la consola, nunca con el texto del cliente. */
export type SkipReason =
  | 'paused'
  | 'blocked'
  | 'no-topic'
  | 'low-confidence'
  | 'complaint'
  | 'rule-not-auto'
  | 'missing-info'
  | 'already-answered'
  | 'send-failed';

export type AutoReplyDecision =
  | { sent: true; topic: AutoTopic; confidence: number }
  | { sent: false; reason: SkipReason; topic: TopicId | null; confidence: number | null };

const REASON_TEXT: Record<SkipReason, string> = {
  paused: 'respuestas automáticas en pausa',
  blocked: 'tema prohibido',
  'no-topic': 'sin tema reconocido',
  'low-confidence': 'confianza baja',
  complaint: 'los reclamos nunca se contestan solos',
  'rule-not-auto': 'la consulta no está en "Contesta solo"',
  'missing-info': 'falta información',
  'already-answered': 'ya se respondió en este turno',
  'send-failed': 'el canal no aceptó el envío',
};

const TOPIC_TEXT: Record<TopicId, string> = {
  hours: 'horario',
  location: 'ubicación',
  pricing: 'precios',
  availability: 'disponibilidad',
  shipping: 'envíos',
  orders: 'encargos',
  complaints: 'reclamos',
};

const isAutoTopic = (topic: TopicId): topic is AutoTopic =>
  (AUTO_TOPICS as readonly string[]).includes(topic);

/** Texto del registro, por ejemplo: "Contesta solo: horario, confianza 0.92, enviado". */
export function describeDecision(decision: AutoReplyDecision): string {
  const details = [
    decision.topic ? TOPIC_TEXT[decision.topic] : null,
    decision.confidence !== null ? `confianza ${decision.confidence.toFixed(2)}` : null,
    decision.sent ? 'enviado' : `no enviado: ${REASON_TEXT[decision.reason]}`,
  ].filter(Boolean);
  return `Contesta solo: ${details.join(', ')}`;
}

export interface AutoReplyOptions {
  minConfidence: number;
  /** Dónde se registra cada decisión (la consola por defecto). */
  log?: (line: string) => void;
}

/**
 * Motor "Contesta solo": después de guardar cada texto de una persona decide si Colibri contesta
 * con la información del negocio. Si alguna condición falla, no hace nada y la conversación queda
 * pendiente, como siempre.
 */
export class AutoReplyService {
  /** Una cola por conversación: dos mensajes seguidos no producen dos respuestas a la vez. */
  private readonly queues = new Map<string, Promise<unknown>>();
  private readonly log: (line: string) => void;

  constructor(
    private readonly conversations: ConversationService,
    private readonly assistant: AssistantRepository,
    private readonly analyzer: MessageAnalyzer,
    private readonly composer: ReplyComposer,
    private readonly options: AutoReplyOptions,
  ) {
    this.log = options.log ?? ((line) => console.log(line));
  }

  /** Empieza a escuchar los mensajes que llegan. */
  attach(): void {
    this.conversations.onReceivedText((event) => this.handle(event).then(() => undefined));
  }

  /** Procesa un mensaje en la cola de su conversación y registra la decisión. */
  handle(event: ReceivedText): Promise<AutoReplyDecision> {
    const id = event.conversation.id;
    const previous = this.queues.get(id) ?? Promise.resolve();
    const next = previous.then(() => this.decide(event));
    const tail = next.catch(() => undefined);
    this.queues.set(id, tail);
    void tail.finally(() => {
      if (this.queues.get(id) === tail) this.queues.delete(id);
    });
    return next.then((decision) => {
      this.log(describeDecision(decision));
      return decision;
    });
  }

  private async decide({ conversation, message }: ReceivedText): Promise<AutoReplyDecision> {
    const settings = await this.assistant.get();
    if (settings.autoReplyPaused) {
      return { sent: false, reason: 'paused', topic: null, confidence: null };
    }

    const analysis = await this.analyzer.analyze({
      text: message.text ?? '',
      channel: conversation.channel,
      blockedTopics: settings.blockedTopics,
    });
    const { topic } = analysis;
    // Se acota por si un analizador devuelve algo fuera de rango.
    const confidence = Math.min(1, Math.max(0, analysis.confidence || 0));
    const skip = (reason: SkipReason): AutoReplyDecision => ({
      sent: false,
      reason,
      topic,
      confidence,
    });

    if (analysis.blocked) return skip('blocked');
    if (topic === null) return skip('no-topic');
    if (!isAutoTopic(topic)) return skip('complaint');
    if (confidence < this.options.minConfidence) return skip('low-confidence');
    if (settings.rules[topic] !== 'auto') return skip('rule-not-auto');

    const reply = await this.composer.compose(topic, settings);
    if (!reply.ready) return skip('missing-info');

    // Una sola respuesta por turno: si alguien (persona o Colibri) ya contestó, no se repite.
    const current = await this.conversations.find(conversation.id);
    if (!current?.awaitingSince) return skip('already-answered');

    try {
      await this.conversations.reply(conversation.id, reply.text, 'colibri');
    } catch (error) {
      if (error instanceof HttpError) return skip('send-failed');
      throw error;
    }
    return { sent: true, topic, confidence };
  }
}
