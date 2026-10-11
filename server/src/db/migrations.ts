export interface Migration {
  /** Número y nombre únicos. Nunca se edita una migración ya aplicada: se agrega otra. */
  id: string;
  sql: string;
}

/** Cambios al esquema de la base de datos, en orden. Se aplican solos al iniciar el servidor. */
export const migrations: readonly Migration[] = [
  {
    id: '001_conversations_and_messages',
    sql: `
      CREATE TABLE conversations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        channel text NOT NULL,
        contact_id text NOT NULL,
        contact_name text,
        last_message_at timestamptz NOT NULL DEFAULT to_timestamp(0),
        last_message_preview text NOT NULL DEFAULT '',
        last_inbound_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (channel, contact_id)
      );

      CREATE INDEX conversations_last_message_idx ON conversations (last_message_at DESC);

      CREATE TABLE messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id uuid NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
        channel text NOT NULL,
        external_id text NOT NULL,
        direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
        type text NOT NULL,
        text text,
        status text NOT NULL,
        created_at timestamptz NOT NULL,
        UNIQUE (channel, external_id)
      );

      CREATE INDEX messages_conversation_idx ON messages (conversation_id, created_at);
    `,
  },
  {
    id: '002_users_and_sessions',
    sql: `
      CREATE TABLE users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email text NOT NULL UNIQUE,
        password_hash text NOT NULL,
        name text,
        role text,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE sessions (
        token_hash text PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        expires_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE INDEX sessions_user_idx ON sessions (user_id);
      CREATE INDEX sessions_expires_idx ON sessions (expires_at);
    `,
  },
  {
    id: '003_business',
    sql: `
      -- Un solo negocio por instalación: la fila siempre tiene id = 1.
      CREATE TABLE business (
        id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
        name text,
        region text,
        address text,
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `,
  },
  {
    id: '004_assistant_settings',
    sql: `
      -- Cómo atiende Colibri. Una sola fila por instalación (id = 1).
      CREATE TABLE assistant_settings (
        id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
        rules jsonb NOT NULL,
        blocked_topics jsonb NOT NULL DEFAULT '[]',
        tone text NOT NULL,
        treatment text NOT NULL,
        signature text,
        onboarding_completed_at timestamptz,
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `,
  },
  {
    id: '005_conversation_awaiting_since',
    sql: `
      -- Desde cuándo espera respuesta cada conversación (para "Esperando 2 h" y ordenar la bandeja).
      ALTER TABLE conversations ADD COLUMN awaiting_since timestamptz;

      -- Conversaciones que ya existían: primer mensaje de la persona después de nuestra última respuesta.
      UPDATE conversations c SET awaiting_since = (
        SELECT min(m.created_at) FROM messages m
        WHERE m.conversation_id = c.id AND m.direction = 'inbound'
          AND m.created_at > COALESCE(
            (SELECT max(o.created_at) FROM messages o
             WHERE o.conversation_id = c.id AND o.direction = 'outbound'),
            '-infinity'::timestamptz)
      );
    `,
  },
  {
    id: '006_auto_replies',
    sql: `
      -- Quién escribió cada mensaje: el cliente, una persona del negocio o Colibri.
      ALTER TABLE messages ADD COLUMN author text NOT NULL DEFAULT 'customer'
        CHECK (author IN ('customer', 'person', 'colibri'));
      UPDATE messages SET author = 'person' WHERE direction = 'outbound';
      CREATE INDEX messages_author_idx ON messages (author, created_at);

      -- Lo que Colibri sabe del negocio para contestar solo (una sola fila, id = 1).
      CREATE TABLE business_knowledge (
        id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
        data jsonb NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      -- Interruptor general "Pausar respuestas automáticas".
      ALTER TABLE assistant_settings ADD COLUMN auto_reply_paused boolean NOT NULL DEFAULT false;
    `,
  },
];
