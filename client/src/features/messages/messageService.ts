import { httpMessageService } from './httpMessageService';
import type { Conversation, ConversationStats, Message } from './types';

/**
 * Contrato para leer y responder conversaciones. El resto de la aplicación solo conoce esta interfaz.
 *   listConversations -> GET  /api/conversations                 Devuelve Conversation[]
 *   listMessages      -> GET  /api/conversations/:id/messages    Devuelve Message[]
 *   sendMessage       -> POST /api/conversations/:id/messages    Recibe { text }, devuelve Message
 */
export interface MessageService {
  listConversations(): Promise<Conversation[]>;
  listMessages(conversationId: string): Promise<Message[]>;
  sendMessage(conversationId: string, text: string): Promise<Message>;
  /** GET /api/conversations/stats: tiempo promedio de respuesta de la última semana. */
  getStats(): Promise<ConversationStats>;
}

export const messageService: MessageService = httpMessageService;
