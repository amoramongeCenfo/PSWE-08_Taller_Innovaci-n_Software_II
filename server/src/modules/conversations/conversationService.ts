import { HttpError } from '../../lib/httpError';
import type { ConversationRepository } from './conversationRepository';
import type {
  ChannelId,
  Conversation,
  IncomingMessage,
  Message,
  MessageAuthor,
  StatusUpdate,
} from './types';

/** Envía un texto por un canal y devuelve el identificador que el canal le asignó. */
export interface ChannelSender {
  sendText(to: string, text: string): Promise<{ externalId: string }>;
}

/** Error de un canal al enviar. El servicio lo traduce a un error HTTP claro. */
export class ChannelSendError extends Error {
  constructor(
    readonly reason: 'NOT_CONFIGURED' | 'WINDOW_EXPIRED' | 'FAILED',
    message?: string,
  ) {
    super(message ?? reason);
    this.name = 'ChannelSendError';
  }
}

/** WhatsApp solo permite texto libre dentro de las 24 horas siguientes al último mensaje de la persona. */
export const REPLY_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Instagram rechaza textos de más de 1000 bytes. WhatsApp se limita en la ruta (4096 caracteres). */
const MAX_REPLY_BYTES: Partial<Record<ChannelId, number>> = { instagram: 1000 };
/** Messenger rechaza textos de más de 2000 caracteres. */
const MAX_REPLY_CHARS: Partial<Record<ChannelId, number>> = { messenger: 2000 };

function windowExpired(): HttpError {
  return new HttpError(
    409,
    'REPLY_WINDOW_EXPIRED',
    'Pasaron más de 24 horas desde el último mensaje de esta persona. Pídele que escriba de nuevo.',
  );
}

/** Mensaje de texto nuevo de una persona, ya guardado. Lo escucha el motor "Contesta solo". */
export interface ReceivedText {
  conversation: Conversation;
  message: Message;
}

export type ReceivedTextListener = (event: ReceivedText) => Promise<void>;

export class ConversationService {
  private readonly listeners: ReceivedTextListener[] = [];
  /** Trabajo en curso de los oyentes, para esperar a que termine (pruebas y cierre ordenado). */
  private readonly pending = new Set<Promise<void>>();

  constructor(
    private readonly repository: ConversationRepository,
    private readonly senders: Partial<Record<ChannelId, ChannelSender>>,
    private readonly now: () => Date = () => new Date(),
  ) {}

  list() {
    return this.repository.list();
  }

  /** Tiempo promedio de respuesta de los últimos `days` días. */
  responseTime(days: number) {
    const since = new Date(this.now().getTime() - days * 24 * 60 * 60 * 1000);
    return this.repository.responseTimeStats(since.toISOString());
  }

  async listMessages(conversationId: string) {
    await this.requireConversation(conversationId);
    return this.repository.listMessages(conversationId);
  }

  /**
   * Avisa cada texto nuevo de una persona. Los oyentes corren aparte: el webhook le contesta a
   * Meta enseguida, sin esperar a que terminen. Un error de un oyente solo se registra.
   */
  onReceivedText(listener: ReceivedTextListener): void {
    this.listeners.push(listener);
  }

  /** Espera a que terminen los oyentes en curso. */
  async idle(): Promise<void> {
    while (this.pending.size > 0) await Promise.all([...this.pending]);
  }

  /** Guarda un mensaje recibido. Si el canal lo repite, no se duplica. */
  async receive(incoming: IncomingMessage): Promise<{ created: boolean }> {
    const conversation = await this.repository.findOrCreate(
      incoming.channel,
      incoming.contactId,
      incoming.contactName,
    );
    const { message, created } = await this.repository.addMessage(incoming.channel, {
      conversationId: conversation.id,
      externalId: incoming.externalId,
      direction: 'inbound',
      type: incoming.type,
      text: incoming.text,
      status: 'received',
      createdAt: incoming.createdAt,
    });
    if (created && message.type === 'text' && message.text) this.notify(conversation, message);
    return { created };
  }

  applyStatus(update: StatusUpdate) {
    return this.repository.updateMessageStatus(update.channel, update.externalId, update.status);
  }

  /** Respuestas automáticas de los últimos `days` días. */
  autoReplies(days: number) {
    const since = new Date(this.now().getTime() - days * 24 * 60 * 60 * 1000);
    return this.repository.countAutoReplies(since.toISOString());
  }

  /** La conversación tal como está ahora (o null si no existe). */
  find(conversationId: string) {
    return this.repository.get(conversationId);
  }

  /** Envía una respuesta (de una persona o de Colibri) y la guarda en la conversación. */
  async reply(
    conversationId: string,
    text: string,
    author: Exclude<MessageAuthor, 'customer'> = 'person',
  ): Promise<Message> {
    const conversation = await this.requireConversation(conversationId);

    const maxBytes = MAX_REPLY_BYTES[conversation.channel];
    const maxChars = MAX_REPLY_CHARS[conversation.channel];
    const tooLong =
      (maxBytes !== undefined && Buffer.byteLength(text) > maxBytes) ||
      (maxChars !== undefined && [...text].length > maxChars);
    if (tooLong) {
      throw new HttpError(
        400,
        'MESSAGE_TOO_LONG',
        'El mensaje es demasiado largo para este canal. Acórtalo e inténtalo de nuevo.',
      );
    }

    const lastInbound = conversation.lastInboundAt ? Date.parse(conversation.lastInboundAt) : null;
    if (lastInbound === null || this.now().getTime() - lastInbound > REPLY_WINDOW_MS) {
      throw windowExpired();
    }

    const sender = this.senders[conversation.channel];
    if (!sender) {
      throw new HttpError(503, 'CHANNEL_NOT_CONFIGURED', 'Este canal todavía no está configurado.');
    }

    try {
      const { externalId } = await sender.sendText(conversation.contactId, text);
      const { message } = await this.repository.addMessage(conversation.channel, {
        conversationId: conversation.id,
        externalId,
        direction: 'outbound',
        type: 'text',
        text,
        status: 'sent',
        createdAt: this.now().toISOString(),
        author,
      });
      return message;
    } catch (error) {
      if (!(error instanceof ChannelSendError)) throw error;
      if (error.reason === 'NOT_CONFIGURED') {
        throw new HttpError(
          503,
          'CHANNEL_NOT_CONFIGURED',
          'Este canal todavía no está configurado.',
        );
      }
      if (error.reason === 'WINDOW_EXPIRED') {
        throw windowExpired();
      }
      throw new HttpError(
        502,
        'CHANNEL_SEND_FAILED',
        'No pudimos enviar el mensaje. Inténtalo de nuevo.',
      );
    }
  }

  private notify(conversation: Conversation, message: Message): void {
    for (const listener of this.listeners) {
      const run = listener({ conversation, message })
        .catch((error: unknown) => {
          console.error('Error al procesar un mensaje recibido:', error);
        })
        .finally(() => this.pending.delete(run));
      this.pending.add(run);
    }
  }

  private async requireConversation(id: string) {
    const conversation = await this.repository.get(id);
    if (!conversation) {
      throw new HttpError(404, 'CONVERSATION_NOT_FOUND', 'No encontramos esa conversación.');
    }
    return conversation;
  }
}
