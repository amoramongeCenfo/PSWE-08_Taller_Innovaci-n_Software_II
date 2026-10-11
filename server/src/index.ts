// Debe ir primero: carga server/.env antes de que `config` lea las variables.
import './env';
import type { Pool } from 'pg';
import { createApp } from './app';
import { loadConfig } from './config';
import { runMigrations } from './db/migrate';
import { createPool } from './db/pool';
import type { AuthRepository } from './modules/auth/authRepository';
import { AuthService } from './modules/auth/authService';
import { MemoryAuthRepository } from './modules/auth/memoryAuthRepository';
import { PostgresAuthRepository } from './modules/auth/postgresAuthRepository';
import type { ConversationRepository } from './modules/conversations/conversationRepository';
import { ConversationService } from './modules/conversations/conversationService';
import { MemoryConversationRepository } from './modules/conversations/memoryConversationRepository';
import { PostgresConversationRepository } from './modules/conversations/postgresConversationRepository';
import type { AssistantRepository } from './modules/assistant/assistantRepository';
import { MemoryAssistantRepository } from './modules/assistant/memoryAssistantRepository';
import { PostgresAssistantRepository } from './modules/assistant/postgresAssistantRepository';
import { AutoReplyService } from './modules/autoreply/autoReplyService';
import { BasicMessageAnalyzer } from './modules/autoreply/basicMessageAnalyzer';
import type { MessageAnalyzer } from './modules/autoreply/messageAnalyzer';
import { ReplyComposer } from './modules/autoreply/replyComposer';
import type { KnowledgeRepository } from './modules/knowledge/knowledgeRepository';
import { MemoryKnowledgeRepository } from './modules/knowledge/memoryKnowledgeRepository';
import { PostgresKnowledgeRepository } from './modules/knowledge/postgresKnowledgeRepository';
import type { BusinessRepository } from './modules/profile/businessRepository';
import { MemoryBusinessRepository } from './modules/profile/memoryBusinessRepository';
import { PostgresBusinessRepository } from './modules/profile/postgresBusinessRepository';
import { ProfileService } from './modules/profile/profileService';
import {
  createInstagramClient,
  createInstagramProfileLookup,
} from './modules/instagram/instagram.client';
import {
  createMessengerClient,
  createMessengerProfileLookup,
} from './modules/messenger/messenger.client';
import { createWhatsAppClient } from './modules/whatsapp/whatsapp.client';

const appConfig = loadConfig();
if (appConfig.instagram.simulate) {
  console.log('Instagram: MODO SIMULADO. Las respuestas no se envían a Meta.');
}

interface Storage {
  conversations: ConversationRepository;
  auth: AuthRepository;
  business: BusinessRepository;
  assistant: AssistantRepository;
  knowledge: KnowledgeRepository;
  pool: Pool | null;
}

/** Elige dónde se guarda todo: PostgreSQL si hay DATABASE_URL, si no, memoria. */
async function createStorage(): Promise<Storage> {
  if (!appConfig.database.url) {
    console.log('Almacenamiento: memoria (sin DATABASE_URL). Los datos se pierden al reiniciar.');
    return {
      conversations: new MemoryConversationRepository(),
      auth: new MemoryAuthRepository(),
      business: new MemoryBusinessRepository(),
      assistant: new MemoryAssistantRepository(),
      knowledge: new MemoryKnowledgeRepository(),
      pool: null,
    };
  }

  const pool = createPool(appConfig.database.url);
  const applied = await runMigrations(pool);
  console.log(`Almacenamiento: PostgreSQL (${applied.length} migración(es) aplicada(s) ahora).`);
  return {
    conversations: new PostgresConversationRepository(pool),
    auth: new PostgresAuthRepository(pool),
    business: new PostgresBusinessRepository(pool),
    assistant: new PostgresAssistantRepository(pool),
    knowledge: new PostgresKnowledgeRepository(pool),
    pool,
  };
}

/** Crea la cuenta inicial definida en server/.env y avisa qué pasó. */
async function prepareInitialAccount(auth: AuthService): Promise<void> {
  const result = await auth.ensureInitialAdmin({
    email: appConfig.auth.adminEmail,
    password: appConfig.auth.adminPassword,
  });
  const messages = {
    skipped:
      'Cuenta de acceso: ninguna. Define AUTH_ADMIN_EMAIL y AUTH_ADMIN_PASSWORD en server/.env para poder iniciar sesión.',
    created: `Cuenta de acceso: se creó ${appConfig.auth.adminEmail}.`,
    'password-updated': `Cuenta de acceso: se actualizó la contraseña de ${appConfig.auth.adminEmail}.`,
    unchanged: `Cuenta de acceso: ${appConfig.auth.adminEmail} lista.`,
  };
  console.log(messages[result]);
}

async function main(): Promise<void> {
  const {
    conversations: conversationRepository,
    auth: authRepository,
    business: businessRepository,
    assistant: assistantRepository,
    knowledge: knowledgeRepository,
    pool,
  } = await createStorage();

  const auth = new AuthService(authRepository);
  const profile = new ProfileService(authRepository, businessRepository);
  await prepareInitialAccount(auth);

  const composer = new ReplyComposer(
    knowledgeRepository,
    assistantRepository,
    businessRepository,
    appConfig.autoReply.timeZone,
  );

  const conversations = new ConversationService(conversationRepository, {
    whatsapp: createWhatsAppClient(appConfig.whatsapp),
    instagram: createInstagramClient(appConfig.instagram),
    messenger: createMessengerClient(appConfig.messenger),
  });

  // Analizador de mensajes: aquí se conecta el del área de análisis (ver docs/analizador-de-mensajes.md).
  const analyzer: MessageAnalyzer = new BasicMessageAnalyzer();
  new AutoReplyService(conversations, assistantRepository, analyzer, composer, {
    minConfidence: appConfig.autoReply.minConfidence,
  }).attach();

  const server = createApp(appConfig, {
    auth,
    conversations,
    profile,
    assistant: assistantRepository,
    knowledge: knowledgeRepository,
    composer,
    instagramLookup: createInstagramProfileLookup(appConfig.instagram),
    messengerLookup: createMessengerProfileLookup(appConfig.messenger),
  }).listen(appConfig.server.port, () => {
    console.log(`API escuchando en http://localhost:${appConfig.server.port}`);
  });

  function shutdown(signal: string): void {
    console.log(`${signal} recibido, cerrando servidor...`);
    server.close(() => {
      // Deja terminar las respuestas automáticas en curso antes de cerrar la base de datos.
      void conversations
        .idle()
        .then(() => pool?.end())
        .finally(() => process.exit(0));
    });
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error: unknown) => {
  // Lo más común: DATABASE_URL incorrecta o PostgreSQL apagado.
  console.error('No se pudo iniciar el servidor:', error instanceof Error ? error.message : error);
  process.exit(1);
});
