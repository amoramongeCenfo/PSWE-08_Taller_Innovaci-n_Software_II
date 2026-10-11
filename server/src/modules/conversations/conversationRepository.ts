import type {
  ChannelId,
  Conversation,
  Message,
  MessageStatus,
  NewMessage,
  ResponseTimeStats,
} from './types';

/**
 * Contrato de almacenamiento de conversaciones y mensajes. El resto del servidor solo conoce
 * esta interfaz. Hoy la implementa `MemoryConversationRepository` (se pierde al reiniciar);
 * para PostgreSQL se crea otra implementación y se cambia en index.ts.
 */
export interface ConversationRepository {
  /** Devuelve la conversación de esa persona en ese canal; la crea si no existe. */
  findOrCreate(
    channel: ChannelId,
    contactId: string,
    contactName: string | null,
  ): Promise<Conversation>;
  /** Conversaciones, la más reciente primero. */
  list(): Promise<Conversation[]>;
  get(id: string): Promise<Conversation | null>;
  /** Mensajes de una conversación, del más antiguo al más nuevo. */
  listMessages(conversationId: string): Promise<Message[]>;
  /**
   * Guarda un mensaje y actualiza el resumen de la conversación.
   * Si ya existe uno con el mismo `externalId` en ese canal, no lo duplica (`created: false`).
   */
  addMessage(
    channel: ChannelId,
    message: NewMessage,
  ): Promise<{ message: Message; created: boolean }>;
  updateMessageStatus(channel: ChannelId, externalId: string, status: MessageStatus): Promise<void>;
  /**
   * Tiempo promedio de respuesta: desde el PRIMER mensaje de la persona en un turno (los que
   * manda seguidos cuentan como uno) hasta la primera respuesta del negocio. Solo cuentan las
   * respuestas enviadas desde `since`.
   */
  responseTimeStats(since: string): Promise<ResponseTimeStats>;
  /** Cuántos mensajes envió Colibri solo (author = 'colibri') desde `since`. */
  countAutoReplies(since: string): Promise<number>;
}
