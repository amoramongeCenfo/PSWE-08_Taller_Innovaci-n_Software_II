import { randomUUID } from 'node:crypto';
import type { ConversationRepository } from './conversationRepository';
import { defaultAuthor, previewOf, shouldApplyStatus } from './conversationRules';
import type {
  ChannelId,
  Conversation,
  Message,
  MessageStatus,
  NewMessage,
  ResponseTimeStats,
} from './types';

/** Almacenamiento en memoria: sencillo y rápido para desarrollar. Los datos se pierden al reiniciar. */
export class MemoryConversationRepository implements ConversationRepository {
  private readonly conversations = new Map<string, Conversation>();
  private readonly messages = new Map<string, Message[]>();
  private readonly byContact = new Map<string, string>();
  private readonly byExternalId = new Map<string, Message>();

  async findOrCreate(channel: ChannelId, contactId: string, contactName: string | null) {
    const key = `${channel}:${contactId}`;
    const existingId = this.byContact.get(key);
    const existing = existingId ? this.conversations.get(existingId) : undefined;

    if (existing) {
      // El nombre puede llegar después del primer mensaje; se conserva el último conocido.
      if (contactName && existing.contactName !== contactName) existing.contactName = contactName;
      return { ...existing };
    }

    const conversation: Conversation = {
      id: randomUUID(),
      channel,
      contactId,
      contactName,
      lastMessageAt: new Date(0).toISOString(),
      lastMessagePreview: '',
      lastInboundAt: null,
      awaitingSince: null,
    };
    this.conversations.set(conversation.id, conversation);
    this.messages.set(conversation.id, []);
    this.byContact.set(key, conversation.id);
    return { ...conversation };
  }

  async list() {
    return [...this.conversations.values()]
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
      .map((conversation) => ({ ...conversation }));
  }

  async get(id: string) {
    const conversation = this.conversations.get(id);
    return conversation ? { ...conversation } : null;
  }

  async listMessages(conversationId: string) {
    return [...(this.messages.get(conversationId) ?? [])].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    );
  }

  async addMessage(channel: ChannelId, input: NewMessage) {
    const key = `${channel}:${input.externalId}`;
    const duplicate = this.byExternalId.get(key);
    if (duplicate) return { message: { ...duplicate }, created: false };

    const conversation = this.conversations.get(input.conversationId);
    if (!conversation) throw new Error(`La conversación ${input.conversationId} no existe`);

    const message: Message = {
      id: randomUUID(),
      ...input,
      author: input.author ?? defaultAuthor(input.direction),
    };
    this.messages.get(conversation.id)?.push(message);
    this.byExternalId.set(key, message);

    if (message.createdAt >= conversation.lastMessageAt) {
      conversation.lastMessageAt = message.createdAt;
      conversation.lastMessagePreview = previewOf(input);
    }
    if (
      message.direction === 'inbound' &&
      (!conversation.lastInboundAt || message.createdAt > conversation.lastInboundAt)
    ) {
      conversation.lastInboundAt = message.createdAt;
    }
    // Espera: empieza con el primer mensaje de la persona y termina con nuestra respuesta.
    if (message.direction === 'inbound') {
      conversation.awaitingSince ??= message.createdAt;
    } else if (conversation.awaitingSince && message.createdAt >= conversation.awaitingSince) {
      conversation.awaitingSince = null;
    }

    return { message: { ...message }, created: true };
  }

  async updateMessageStatus(channel: ChannelId, externalId: string, status: MessageStatus) {
    const message = this.byExternalId.get(`${channel}:${externalId}`);
    if (!message) return;
    if (shouldApplyStatus(message.status, status)) message.status = status;
  }

  async responseTimeStats(since: string): Promise<ResponseTimeStats> {
    const sinceMs = Date.parse(since);
    let total = 0;
    let samples = 0;
    for (const messages of this.messages.values()) {
      let askedAt: number | null = null;
      for (const message of messages) {
        const at = Date.parse(message.createdAt);
        if (message.direction === 'inbound') {
          askedAt ??= at;
        } else if (askedAt !== null) {
          if (at >= sinceMs) {
            total += at - askedAt;
            samples += 1;
          }
          askedAt = null;
        }
      }
    }
    return { averageSeconds: samples ? total / samples / 1000 : null, samples };
  }

  async countAutoReplies(since: string): Promise<number> {
    let count = 0;
    for (const messages of this.messages.values()) {
      count += messages.filter((m) => m.author === 'colibri' && m.createdAt >= since).length;
    }
    return count;
  }
}
