import { apiRequest } from '../../lib/http';
import type { MessageService } from './messageService';
import type { Conversation, ConversationStats, Message } from './types';

export const httpMessageService: MessageService = {
  listConversations: () => apiRequest<Conversation[]>('/conversations'),

  getStats: () => apiRequest<ConversationStats>('/conversations/stats'),

  listMessages: (conversationId) =>
    apiRequest<Message[]>(`/conversations/${encodeURIComponent(conversationId)}/messages`),

  sendMessage: (conversationId, text) =>
    apiRequest<Message>(`/conversations/${encodeURIComponent(conversationId)}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
};
