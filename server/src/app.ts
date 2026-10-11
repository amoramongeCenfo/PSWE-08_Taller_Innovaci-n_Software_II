import express, { type ErrorRequestHandler, type Express } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import type { AppConfig } from './config';
import { HttpError } from './lib/httpError';
import { createAuthRouter } from './modules/auth/authRoutes';
import type { AuthService } from './modules/auth/authService';
import { requireAuth } from './modules/auth/requireAuth';
import type { AssistantRepository } from './modules/assistant/assistantRepository';
import { createAssistantRouter } from './modules/assistant/assistantRoutes';
import type { ReplyComposer } from './modules/autoreply/replyComposer';
import { createChannelRouter } from './modules/channels/channelRoutes';
import type { ConversationService } from './modules/conversations/conversationService';
import { createConversationRouter } from './modules/conversations/conversationRoutes';
import type { KnowledgeRepository } from './modules/knowledge/knowledgeRepository';
import { createKnowledgeRouter } from './modules/knowledge/knowledgeRoutes';
import { createBusinessRouter, createProfileRouter } from './modules/profile/profileRoutes';
import type { ProfileService } from './modules/profile/profileService';
import { createInstagramRouter, type ProfileLookup } from './modules/instagram/instagram.routes';
import { createMessengerRouter } from './modules/messenger/messenger.routes';
import { createWhatsAppRouter } from './modules/whatsapp/whatsapp.routes';

export interface AppServices {
  auth: AuthService;
  conversations: ConversationService;
  profile: ProfileService;
  assistant: AssistantRepository;
  knowledge: KnowledgeRepository;
  /** Arma las respuestas automáticas con la información del negocio. */
  composer: ReplyComposer;
  /** Busca el nombre de quien escribe por Instagram. Opcional: sin él, se guarda sin nombre. */
  instagramLookup?: ProfileLookup;
  /** Busca el nombre de quien escribe por Messenger. Opcional: sin él, se guarda sin nombre. */
  messengerLookup?: ProfileLookup;
}

export function createApp(appConfig: AppConfig, services: AppServices): Express {
  const app = express();

  app.disable('x-powered-by');
  // Detrás de un túnel local (ngrok, Cloudflare) la IP real llega en X-Forwarded-For.
  app.set('trust proxy', 'loopback');
  app.use(helmet());

  // Se guarda el cuerpo sin modificar: Meta firma esos bytes exactos (ver whatsapp.signature.ts).
  app.use(
    express.json({
      limit: '100kb',
      verify: (req, _res, buffer) => {
        (req as express.Request).rawBody = buffer;
      },
    }),
  );

  // CORS mínimo para desarrollo; en producción se sirve todo bajo el mismo origen.
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', appConfig.cors.origin);
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.use(
    '/api',
    rateLimit({ windowMs: 60_000, limit: 600, standardHeaders: 'draft-8', legacyHeaders: false }),
  );

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(
    '/api/webhooks/whatsapp',
    createWhatsAppRouter(appConfig.whatsapp, services.conversations),
  );
  app.use(
    '/api/webhooks/instagram',
    createInstagramRouter(appConfig.instagram, services.conversations, services.instagramLookup),
  );
  app.use(
    '/api/webhooks/messenger',
    createMessengerRouter(appConfig.messenger, services.conversations, services.messengerLookup),
  );
  app.use('/api/auth', createAuthRouter(services.auth));

  // Todo lo que muestra datos del negocio exige una sesión iniciada. El webhook de Meta no la
  // necesita: se protege con la firma de cada mensaje.
  const authenticated = requireAuth(services.auth);
  app.use('/api/channels', authenticated, createChannelRouter(appConfig));
  app.use('/api/business', authenticated, createBusinessRouter(services.profile));
  app.use('/api/assistant', authenticated, createAssistantRouter(services.assistant));
  app.use(
    '/api/knowledge',
    authenticated,
    createKnowledgeRouter(services.knowledge, services.composer),
  );
  app.use('/api/profile', authenticated, createProfileRouter(services.profile));
  app.use('/api/conversations', authenticated, createConversationRouter(services.conversations));

  app.use('/api', (_req, res) => {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Recurso no encontrado' });
  });

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ code: err.code, message: err.message });
      return;
    }
    // JSON mal formado o cuerpo demasiado grande.
    if (typeof err === 'object' && err !== null && 'status' in err && err.status === 400) {
      res.status(400).json({ code: 'BAD_REQUEST', message: 'La petición no es válida' });
      return;
    }
    console.error(err);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Ocurrió un error inesperado' });
  };
  app.use(errorHandler);

  return app;
}
