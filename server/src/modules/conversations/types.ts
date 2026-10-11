export type ChannelId = 'whatsapp' | 'instagram' | 'messenger';
export type MessageDirection = 'inbound' | 'outbound';
export type MessageType = 'text' | 'unsupported';
/** Quién escribió el mensaje: el cliente, una persona del negocio o Colibri (respuesta automática). */
export type MessageAuthor = 'customer' | 'person' | 'colibri';
export type MessageStatus = 'received' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Conversation {
  id: string;
  channel: ChannelId;
  /** Identificador de la persona en el canal (en WhatsApp, su número; en Instagram, su IGSID; en Messenger, su PSID). */
  contactId: string;
  contactName: string | null;
  lastMessageAt: string;
  lastMessagePreview: string;
  /** Cuándo escribió la persona por última vez. Define la ventana de 24 horas. */
  lastInboundAt: string | null;
  /**
   * Desde cuándo espera respuesta: el primer mensaje de la persona después de nuestra última
   * respuesta. null si no espera nada (ya le respondimos o nunca escribió).
   */
  awaitingSince: string | null;
}

export interface Message {
  id: string;
  conversationId: string;
  /** Identificador del mensaje en el canal (en WhatsApp, el `wamid…`). */
  externalId: string;
  direction: MessageDirection;
  type: MessageType;
  text: string | null;
  status: MessageStatus;
  createdAt: string;
  author: MessageAuthor;
}

export interface NewMessage {
  conversationId: string;
  externalId: string;
  direction: MessageDirection;
  type: MessageType;
  text: string | null;
  status: MessageStatus;
  createdAt: string;
  /** Si no se indica: el cliente en los recibidos y una persona del negocio en los enviados. */
  author?: MessageAuthor;
}

/** Mensaje recibido de un canal, ya traducido al formato de Colibri. */
export interface IncomingMessage {
  channel: ChannelId;
  contactId: string;
  contactName: string | null;
  externalId: string;
  type: MessageType;
  text: string | null;
  createdAt: string;
}

/** Tiempo promedio entre el mensaje de una persona y la primera respuesta del negocio. */
export interface ResponseTimeStats {
  /** null si todavía no hay respuestas en el periodo. */
  averageSeconds: number | null;
  /** Cuántas respuestas se promediaron. */
  samples: number;
}

/** Cambio de estado de entrega de un mensaje que enviamos. */
export interface StatusUpdate {
  channel: ChannelId;
  externalId: string;
  status: MessageStatus;
}
