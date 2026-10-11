/** Indicadores de los últimos días (GET /api/conversations/stats). */
export interface ConversationStats {
  days: number;
  responseTime: { averageSeconds: number | null; samples: number };
  /** Respuestas que Colibri envió solo. */
  autoReplies: number;
}

export type ChannelId = 'whatsapp' | 'instagram' | 'messenger';
export type MessageDirection = 'inbound' | 'outbound';
export type MessageType = 'text' | 'unsupported';
export type MessageStatus = 'received' | 'sent' | 'delivered' | 'read' | 'failed';
/** Quién escribió: el cliente, una persona del negocio o Colibri (respuesta automática). */
export type MessageAuthor = 'customer' | 'person' | 'colibri';

export interface Conversation {
  id: string;
  channel: ChannelId;
  /** Identificador de la persona en el canal (en WhatsApp, su número). */
  contactId: string;
  contactName: string | null;
  lastMessageAt: string;
  lastMessagePreview: string;
  /** Cuándo escribió la persona por última vez. Define la ventana de 24 horas. */
  lastInboundAt: string | null;
  /** Desde cuándo espera respuesta (su primer mensaje sin contestar); null si no espera. */
  awaitingSince: string | null;
}

export interface Message {
  id: string;
  conversationId: string;
  direction: MessageDirection;
  type: MessageType;
  text: string | null;
  status: MessageStatus;
  author: MessageAuthor;
  createdAt: string;
}

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';
