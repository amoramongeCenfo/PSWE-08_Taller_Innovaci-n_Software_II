import type { Pool, PoolClient } from 'pg';
import type { ConversationRepository } from './conversationRepository';
import { defaultAuthor, previewOf, shouldApplyStatus } from './conversationRules';
import type {
  ChannelId,
  Conversation,
  Message,
  MessageAuthor,
  MessageDirection,
  MessageStatus,
  MessageType,
  NewMessage,
  ResponseTimeStats,
} from './types';

interface ConversationRow {
  id: string;
  channel: ChannelId;
  contact_id: string;
  contact_name: string | null;
  last_message_at: Date;
  last_message_preview: string;
  last_inbound_at: Date | null;
  awaiting_since: Date | null;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  external_id: string;
  direction: MessageDirection;
  type: MessageType;
  text: string | null;
  status: MessageStatus;
  created_at: Date;
  author: MessageAuthor;
}

const CONVERSATION_COLUMNS = `id, channel, contact_id, contact_name, last_message_at,
  last_message_preview, last_inbound_at, awaiting_since`;
const MESSAGE_COLUMNS = `id, conversation_id, external_id, direction, type, text, status, created_at, author`;

function toConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    channel: row.channel,
    contactId: row.contact_id,
    contactName: row.contact_name,
    lastMessageAt: row.last_message_at.toISOString(),
    lastMessagePreview: row.last_message_preview,
    lastInboundAt: row.last_inbound_at?.toISOString() ?? null,
    awaitingSince: row.awaiting_since?.toISOString() ?? null,
  };
}

function toMessage(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    externalId: row.external_id,
    direction: row.direction,
    type: row.type,
    text: row.text,
    status: row.status,
    author: row.author,
    createdAt: row.created_at.toISOString(),
  };
}

/** Almacenamiento en PostgreSQL. Las tablas se crean con las migraciones (ver db/migrations.ts). */
export class PostgresConversationRepository implements ConversationRepository {
  constructor(private readonly pool: Pool) {}

  async findOrCreate(channel: ChannelId, contactId: string, contactName: string | null) {
    // El nombre puede llegar después del primer mensaje; se conserva el último conocido.
    const { rows } = await this.pool.query<ConversationRow>(
      `INSERT INTO conversations (channel, contact_id, contact_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (channel, contact_id)
       DO UPDATE SET contact_name = COALESCE(EXCLUDED.contact_name, conversations.contact_name)
       RETURNING ${CONVERSATION_COLUMNS}`,
      [channel, contactId, contactName],
    );
    return toConversation(rows[0] as ConversationRow);
  }

  async list() {
    const { rows } = await this.pool.query<ConversationRow>(
      `SELECT ${CONVERSATION_COLUMNS} FROM conversations ORDER BY last_message_at DESC`,
    );
    return rows.map(toConversation);
  }

  async get(id: string) {
    const { rows } = await this.pool.query<ConversationRow>(
      `SELECT ${CONVERSATION_COLUMNS} FROM conversations WHERE id = $1`,
      [id],
    );
    return rows[0] ? toConversation(rows[0]) : null;
  }

  async listMessages(conversationId: string) {
    const { rows } = await this.pool.query<MessageRow>(
      `SELECT ${MESSAGE_COLUMNS} FROM messages
       WHERE conversation_id = $1 ORDER BY created_at, id`,
      [conversationId],
    );
    return rows.map(toMessage);
  }

  async addMessage(channel: ChannelId, input: NewMessage) {
    return this.inTransaction(async (client) => {
      const inserted = await client.query<MessageRow>(
        `INSERT INTO messages
           (conversation_id, channel, external_id, direction, type, text, status, created_at, author)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (channel, external_id) DO NOTHING
         RETURNING ${MESSAGE_COLUMNS}`,
        [
          input.conversationId,
          channel,
          input.externalId,
          input.direction,
          input.type,
          input.text,
          input.status,
          input.createdAt,
          input.author ?? defaultAuthor(input.direction),
        ],
      );

      if (!inserted.rows[0]) {
        const existing = await client.query<MessageRow>(
          `SELECT ${MESSAGE_COLUMNS} FROM messages WHERE channel = $1 AND external_id = $2`,
          [channel, input.externalId],
        );
        return { message: toMessage(existing.rows[0] as MessageRow), created: false };
      }

      // Resumen de la conversación: solo avanza con mensajes más nuevos que el último guardado.
      // En un UPDATE todas las expresiones ven la fila anterior, por eso los CASE son consistentes.
      await client.query(
        `UPDATE conversations SET
           last_message_preview = CASE WHEN $2::timestamptz >= last_message_at THEN $3
                                       ELSE last_message_preview END,
           last_message_at = GREATEST(last_message_at, $2::timestamptz),
           last_inbound_at = CASE
             WHEN $4::boolean AND (last_inbound_at IS NULL OR $2::timestamptz > last_inbound_at)
               THEN $2::timestamptz
             ELSE last_inbound_at END,
           awaiting_since = CASE
             WHEN $4::boolean THEN COALESCE(awaiting_since, $2::timestamptz)
             WHEN $2::timestamptz >= awaiting_since THEN NULL
             ELSE awaiting_since END
         WHERE id = $1`,
        [input.conversationId, input.createdAt, previewOf(input), input.direction === 'inbound'],
      );

      return { message: toMessage(inserted.rows[0]), created: true };
    });
  }

  async updateMessageStatus(channel: ChannelId, externalId: string, status: MessageStatus) {
    await this.inTransaction(async (client) => {
      const { rows } = await client.query<{ id: string; status: MessageStatus }>(
        `SELECT id, status FROM messages WHERE channel = $1 AND external_id = $2 FOR UPDATE`,
        [channel, externalId],
      );
      const current = rows[0];
      if (current && shouldApplyStatus(current.status, status)) {
        await client.query('UPDATE messages SET status = $2 WHERE id = $1', [current.id, status]);
      }
    });
  }

  private async inTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async responseTimeStats(since: string): Promise<ResponseTimeStats> {
    // Turno = primer mensaje de la persona después de una respuesta nuestra (o el primero de todos).
    const { rows } = await this.pool.query<{ average: string | null; samples: string }>(
      `WITH ordered AS (
         SELECT conversation_id, direction, created_at,
                LAG(direction) OVER (PARTITION BY conversation_id ORDER BY created_at, id) AS previous
         FROM messages
       ),
       turns AS (
         SELECT o.created_at AS asked_at,
                (SELECT min(m.created_at) FROM messages m
                 WHERE m.conversation_id = o.conversation_id
                   AND m.direction = 'outbound' AND m.created_at >= o.created_at) AS answered_at
         FROM ordered o
         WHERE o.direction = 'inbound' AND (o.previous IS NULL OR o.previous = 'outbound')
       )
       SELECT avg(extract(epoch FROM answered_at - asked_at)) AS average, count(*) AS samples
       FROM turns WHERE answered_at IS NOT NULL AND answered_at >= $1`,
      [since],
    );
    const row = rows[0];
    const samples = Number(row?.samples ?? 0);
    return { averageSeconds: samples ? Number(row?.average) : null, samples };
  }

  async countAutoReplies(since: string): Promise<number> {
    const { rows } = await this.pool.query<{ count: string }>(
      `SELECT count(*) AS count FROM messages WHERE author = 'colibri' AND created_at >= $1`,
      [since],
    );
    return Number(rows[0]?.count ?? 0);
  }
}
