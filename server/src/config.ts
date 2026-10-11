import config from 'config';

export interface WhatsAppConfig {
  /** Texto que se compara al verificar el webhook. */
  verifyToken: string;
  /** Secreto de la app de Meta, para validar la firma de cada mensaje recibido. */
  appSecret: string;
  accessToken: string;
  phoneNumberId: string;
  /** Identificador de la cuenta de WhatsApp Business (WABA). Solo lo usa el script de suscripción. */
  businessAccountId: string;
  graphApiVersion: string;
}

export interface InstagramConfig {
  /** Texto que se compara al verificar el webhook de Instagram. */
  verifyToken: string;
  /** Secreto de la app de Instagram, para validar la firma de cada mensaje recibido. */
  appSecret: string;
  accessToken: string;
  /** Identificador de la cuenta profesional de Instagram (la que recibe los mensajes). */
  accountId: string;
  graphApiVersion: string;
  /**
   * Modo de demostración: las respuestas no se envían a Meta (se guardan como enviadas) y los
   * contactos "sim:Nombre" muestran ese nombre. Para presentar sin salir del modo desarrollador.
   */
  simulate: boolean;
  /** Depuración: imprime en la consola el cuerpo completo de cada evento (incluye el texto). */
  debugWebhook: boolean;
}

export interface MessengerConfig {
  /** Texto que se compara al verificar el webhook de Messenger. */
  verifyToken: string;
  /** Secreto de la app de Meta (Configuración > Básica), para validar la firma de cada evento. */
  appSecret: string;
  /** Token de la página de Facebook: sirve para enviar y para leer el nombre de quien escribe. */
  pageAccessToken: string;
  /** Identificador de la página de Facebook que recibe los mensajes. */
  pageId: string;
  graphApiVersion: string;
  /** Depuración: imprime en la consola el cuerpo completo de cada evento (incluye el texto). */
  debugWebhook: boolean;
}

export interface AutoReplyConfig {
  /** Confianza mínima del analizador (0 a 1) para contestar solo. */
  minConfidence: number;
  /** Zona horaria del negocio: decide "hoy" y "mañana" en las respuestas de horario. */
  timeZone: string;
}

export interface AppConfig {
  server: { port: number };
  cors: { origin: string };
  database: {
    /** Dirección de PostgreSQL. Si está vacía, se guarda en memoria (se pierde al reiniciar). */
    url: string;
  };
  auth: {
    /** Cuenta inicial. Se crea al arrancar si no existe (ver AuthService.ensureInitialAdmin). */
    adminEmail: string;
    adminPassword: string;
  };
  whatsapp: WhatsAppConfig;
  instagram: InstagramConfig;
  messenger: MessengerConfig;
  autoReply: AutoReplyConfig;
}

// Único punto de acceso a la configuración: tipado y validado al arrancar.
export function loadConfig(): AppConfig {
  const appConfig: AppConfig = {
    server: { port: config.get<number>('server.port') },
    cors: { origin: config.get<string>('cors.origin') },
    database: { url: config.get<string>('database.url') },
    auth: {
      adminEmail: config.get<string>('auth.adminEmail'),
      adminPassword: config.get<string>('auth.adminPassword'),
    },
    whatsapp: {
      verifyToken: config.get<string>('whatsapp.verifyToken'),
      appSecret: config.get<string>('whatsapp.appSecret'),
      accessToken: config.get<string>('whatsapp.accessToken'),
      phoneNumberId: config.get<string>('whatsapp.phoneNumberId'),
      businessAccountId: config.get<string>('whatsapp.businessAccountId'),
      graphApiVersion: config.get<string>('whatsapp.graphApiVersion'),
    },
    instagram: {
      verifyToken: config.get<string>('instagram.verifyToken'),
      appSecret: config.get<string>('instagram.appSecret'),
      accessToken: config.get<string>('instagram.accessToken'),
      accountId: config.get<string>('instagram.accountId'),
      graphApiVersion: config.get<string>('instagram.graphApiVersion'),
      simulate: config.get<string>('instagram.simulate') === 'true',
      debugWebhook: config.get<string>('instagram.debugWebhook') === 'true',
    },
    messenger: {
      verifyToken: config.get<string>('messenger.verifyToken'),
      appSecret: config.get<string>('messenger.appSecret'),
      pageAccessToken: config.get<string>('messenger.pageAccessToken'),
      pageId: config.get<string>('messenger.pageId'),
      graphApiVersion: config.get<string>('messenger.graphApiVersion'),
      debugWebhook: config.get<string>('messenger.debugWebhook') === 'true',
    },
    autoReply: {
      minConfidence: Number(config.get<string | number>('autoReply.minConfidence')),
      timeZone: config.get<string>('autoReply.timeZone'),
    },
  };

  const { minConfidence, timeZone } = appConfig.autoReply;
  if (!Number.isFinite(minConfidence) || minConfidence < 0 || minConfidence > 1) {
    throw new Error('AUTOREPLY_MIN_CONFIDENCE debe ser un número entre 0 y 1');
  }
  try {
    new Intl.DateTimeFormat('es-CR', { timeZone });
  } catch {
    throw new Error(`AUTOREPLY_TIME_ZONE no es una zona horaria válida: ${timeZone}`);
  }

  // La simulación es solo para demostraciones: en producción jamás debe estar encendida.
  if (appConfig.instagram.simulate && process.env.NODE_ENV === 'production') {
    throw new Error('INSTAGRAM_SIMULATE no se puede usar con NODE_ENV=production');
  }
  return appConfig;
}

/** ¿Puede el servidor recibir mensajes de WhatsApp? (verificar el webhook y validar la firma) */
export function canReceiveWhatsApp({ verifyToken, appSecret }: WhatsAppConfig): boolean {
  return Boolean(verifyToken && appSecret);
}

/** ¿Puede el servidor enviar mensajes por WhatsApp? */
export function canSendWhatsApp({ accessToken, phoneNumberId }: WhatsAppConfig): boolean {
  return Boolean(accessToken && phoneNumberId);
}

/** ¿Puede el servidor recibir mensajes de Instagram? (verificar el webhook y validar la firma) */
export function canReceiveInstagram({ verifyToken, appSecret }: InstagramConfig): boolean {
  return Boolean(verifyToken && appSecret);
}

/** ¿Puede el servidor enviar mensajes por Instagram? */
export function canSendInstagram({ accessToken, accountId, simulate }: InstagramConfig): boolean {
  return simulate || Boolean(accessToken && accountId);
}

/** ¿Puede el servidor recibir mensajes de Messenger? (verificar el webhook y validar la firma) */
export function canReceiveMessenger({ verifyToken, appSecret }: MessengerConfig): boolean {
  return Boolean(verifyToken && appSecret);
}

/** ¿Puede el servidor enviar mensajes por Messenger? */
export function canSendMessenger({ pageAccessToken, pageId }: MessengerConfig): boolean {
  return Boolean(pageAccessToken && pageId);
}
