import { createHmac } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from './app';
import type { AppConfig } from './config';
import {
  ConversationService,
  type ChannelSender,
} from './modules/conversations/conversationService';
import { AuthService } from './modules/auth/authService';
import { MemoryAuthRepository } from './modules/auth/memoryAuthRepository';
import { MemoryAssistantRepository } from './modules/assistant/memoryAssistantRepository';
import { ReplyComposer } from './modules/autoreply/replyComposer';
import { MemoryKnowledgeRepository } from './modules/knowledge/memoryKnowledgeRepository';
import { MemoryBusinessRepository } from './modules/profile/memoryBusinessRepository';
import { ProfileService } from './modules/profile/profileService';
import { MemoryConversationRepository } from './modules/conversations/memoryConversationRepository';

const configured: AppConfig = {
  server: { port: 0 },
  cors: { origin: 'http://localhost:3000' },
  database: { url: '' },
  auth: { adminEmail: '', adminPassword: '' },
  whatsapp: {
    verifyToken: 'token-verificacion',
    appSecret: 'secreto-app',
    accessToken: 'token-acceso',
    phoneNumberId: '111',
    businessAccountId: '222',
    graphApiVersion: 'v23.0',
  },
  instagram: {
    verifyToken: 'ig-verificacion',
    appSecret: 'ig-secreto',
    accessToken: 'ig-token',
    accountId: '999',
    graphApiVersion: 'v23.0',
    simulate: false,
    debugWebhook: false,
  },
  messenger: {
    verifyToken: 'fb-verificacion',
    appSecret: 'fb-secreto',
    pageAccessToken: 'fb-token',
    pageId: '555',
    graphApiVersion: 'v23.0',
    debugWebhook: false,
  },
  autoReply: { minConfidence: 0.7, timeZone: 'America/Costa_Rica' },
};
const unconfigured: AppConfig = {
  ...configured,
  whatsapp: {
    ...configured.whatsapp,
    verifyToken: '',
    appSecret: '',
    accessToken: '',
    phoneNumberId: '',
  },
  instagram: {
    ...configured.instagram,
    verifyToken: '',
    appSecret: '',
    accessToken: '',
    accountId: '',
  },
  messenger: {
    ...configured.messenger,
    verifyToken: '',
    appSecret: '',
    pageAccessToken: '',
    pageId: '',
  },
};

let server: Server | undefined;
afterEach(
  () => new Promise<void>((resolve) => (server ? server.close(() => resolve()) : resolve())),
);

const TEST_USER = { email: 'ana@colibri.cr', password: 'clave-segura-1' };

/** Cookie de sesión de la prueba en curso; se envía en las llamadas a rutas protegidas. */
let sessionCookie = '';

async function start(config: AppConfig, sender?: ChannelSender, { signedIn = true } = {}) {
  const conversations = new ConversationService(
    new MemoryConversationRepository(),
    sender ? { whatsapp: sender } : {},
  );
  const authRepository = new MemoryAuthRepository();
  const auth = new AuthService(authRepository);
  const businessRepository = new MemoryBusinessRepository();
  const profile = new ProfileService(authRepository, businessRepository);
  const assistant = new MemoryAssistantRepository();
  const knowledge = new MemoryKnowledgeRepository();
  const composer = new ReplyComposer(
    knowledge,
    assistant,
    businessRepository,
    'America/Costa_Rica',
    () => new Date('2026-10-12T16:00:00Z'),
  );
  await auth.ensureInitialAdmin({ email: TEST_USER.email, password: TEST_USER.password });
  sessionCookie = signedIn
    ? `colibri_session=${(await auth.login(TEST_USER.email, TEST_USER.password, false)).token}`
    : '';

  server = createApp(config, {
    auth,
    conversations,
    profile,
    assistant,
    knowledge,
    composer,
    instagramLookup: async () => 'Ana IG',
    messengerLookup: async () => 'Luis FB',
  }).listen(0);
  const { port } = server.address() as AddressInfo;
  return `http://127.0.0.1:${port}`;
}

/** fetch con la sesión de la prueba, para las rutas que la exigen. */
const api = (url: string, init: RequestInit = {}) =>
  fetch(url, { ...init, headers: { ...init.headers, Cookie: sessionCookie } });

function webhookBody(id: string, timestamp = String(Math.floor(Date.now() / 1000))) {
  return JSON.stringify({
    object: 'whatsapp_business_account',
    entry: [
      {
        changes: [
          {
            field: 'messages',
            value: {
              metadata: { phone_number_id: '111' },
              contacts: [{ wa_id: '506', profile: { name: 'Ana' } }],
              messages: [{ from: '506', id, timestamp, type: 'text', text: { body: 'Hola' } }],
            },
          },
        ],
      },
    ],
  });
}

const signed = (body: string, secret = configured.whatsapp.appSecret) => ({
  'Content-Type': 'application/json',
  'X-Hub-Signature-256': `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`,
});

describe('verificación del webhook (GET)', () => {
  const query = (token: string) =>
    `/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=${token}&hub.challenge=12345`;

  it('devuelve el reto si el token coincide', async () => {
    const base = await start(configured);
    const response = await fetch(base + query('token-verificacion'));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('12345');
  });

  it('responde 403 si el token no coincide', async () => {
    const base = await start(configured);
    expect((await fetch(base + query('otro'))).status).toBe(403);
  });

  it('responde 503 si WhatsApp no está configurado', async () => {
    const base = await start(unconfigured);
    expect((await fetch(base + query('x'))).status).toBe(503);
  });
});

describe('mensajes entrantes (POST)', () => {
  it('guarda un mensaje firmado y no lo duplica si Meta lo repite', async () => {
    const base = await start(configured);
    const body = webhookBody('wamid.1');

    for (let i = 0; i < 2; i++) {
      const response = await fetch(`${base}/api/webhooks/whatsapp`, {
        method: 'POST',
        headers: signed(body),
        body,
      });
      expect(response.status).toBe(200);
    }

    const conversations = (await (await api(`${base}/api/conversations`)).json()) as {
      id: string;
      contactName: string;
    }[];
    expect(conversations).toHaveLength(1);
    expect(conversations[0]?.contactName).toBe('Ana');
    const messages = (await (
      await api(`${base}/api/conversations/${conversations[0]!.id}/messages`)
    ).json()) as unknown[];
    expect(messages).toHaveLength(1);
  });

  it('rechaza con 401 una firma inválida y no guarda nada', async () => {
    const base = await start(configured);
    const body = webhookBody('wamid.2');
    const response = await fetch(`${base}/api/webhooks/whatsapp`, {
      method: 'POST',
      headers: signed(body, 'secreto-falso'),
      body,
    });
    expect(response.status).toBe(401);
    expect(await (await api(`${base}/api/conversations`)).json()).toEqual([]);
  });

  it('rechaza con 401 si no hay firma', async () => {
    const base = await start(configured);
    const response = await fetch(`${base}/api/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: webhookBody('wamid.3'),
    });
    expect(response.status).toBe(401);
  });

  it('responde 200 a eventos firmados que no nos interesan', async () => {
    const base = await start(configured);
    const body = JSON.stringify({ object: 'page', entry: [] });
    const response = await fetch(`${base}/api/webhooks/whatsapp`, {
      method: 'POST',
      headers: signed(body),
      body,
    });
    expect(response.status).toBe(200);
  });
});

describe('responder desde el cliente', () => {
  async function withIncoming(sender: ChannelSender, timestamp?: string) {
    const base = await start(configured, sender);
    const body = webhookBody('wamid.in', timestamp);
    await fetch(`${base}/api/webhooks/whatsapp`, { method: 'POST', headers: signed(body), body });
    const [conversation] = (await (await api(`${base}/api/conversations`)).json()) as {
      id: string;
    }[];
    return { base, id: conversation!.id };
  }
  const post = (base: string, id: string, payload: unknown) =>
    api(`${base}/api/conversations/${id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

  it('envía y devuelve el mensaje guardado', async () => {
    const sendText = vi.fn().mockResolvedValue({ externalId: 'wamid.out' });
    const { base, id } = await withIncoming({ sendText });
    const response = await post(base, id, { text: '  Abrimos a las 8  ' });
    expect(response.status).toBe(201);
    expect(sendText).toHaveBeenCalledWith('506', 'Abrimos a las 8');
    expect(await response.json()).toMatchObject({ direction: 'outbound', text: 'Abrimos a las 8' });
  });

  it('valida el texto', async () => {
    const { base, id } = await withIncoming({ sendText: vi.fn() });
    expect((await post(base, id, { text: '   ' })).status).toBe(400);
    expect((await post(base, id, {})).status).toBe(400);
    expect((await post(base, id, { text: 'x'.repeat(4097) })).status).toBe(400);
  });

  it('responde 409 si pasaron más de 24 horas', async () => {
    const old = String(Math.floor(Date.now() / 1000) - 25 * 3600);
    const { base, id } = await withIncoming({ sendText: vi.fn() }, old);
    const response = await post(base, id, { text: 'Hola' });
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: 'REPLY_WINDOW_EXPIRED' });
  });

  it('responde 404 si la conversación no existe', async () => {
    const base = await start(configured, { sendText: vi.fn() });
    expect((await post(base, 'no-existe', { text: 'Hola' })).status).toBe(404);
    expect((await api(`${base}/api/conversations/no-existe/messages`)).status).toBe(404);
  });
});

describe('estado de canales y errores', () => {
  it('informa si WhatsApp está activo o sin configurar', async () => {
    const active = await start(configured);
    expect(await (await api(`${active}/api/channels`)).json()).toEqual([
      { id: 'whatsapp', name: 'WhatsApp', state: 'active' },
      { id: 'instagram', name: 'Instagram', state: 'active' },
      { id: 'messenger', name: 'Messenger', state: 'active' },
    ]);
    await new Promise<void>((resolve) => server?.close(() => resolve()));
    const idle = await start(unconfigured);
    expect(await (await api(`${idle}/api/channels`)).json()).toEqual([
      { id: 'whatsapp', name: 'WhatsApp', state: 'not_configured' },
      { id: 'instagram', name: 'Instagram', state: 'not_configured' },
      { id: 'messenger', name: 'Messenger', state: 'not_configured' },
    ]);
  });

  it('mantiene /api/health y responde 404 con código en rutas desconocidas', async () => {
    const base = await start(configured);
    expect(await (await fetch(`${base}/api/health`)).json()).toEqual({ status: 'ok' });
    const response = await fetch(`${base}/api/nada`);
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ code: 'NOT_FOUND' });
  });

  it('responde 400 a un JSON mal formado y nunca expone tokens', async () => {
    const base = await start(configured);
    const response = await api(`${base}/api/conversations/x/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{mal',
    });
    expect(response.status).toBe(400);
    const text = await response.text();
    expect(text).not.toContain('token-acceso');
    expect(text).not.toContain('secreto-app');
  });

  it('envía cabeceras de seguridad', async () => {
    const base = await start(configured);
    const response = await fetch(`${base}/api/health`);
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('x-powered-by')).toBeNull();
  });
});

describe('inicio de sesión y acceso', () => {
  const login = (base: string, payload: unknown) =>
    fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  const cookieFrom = (response: Response) => {
    const header = response.headers.getSetCookie().find((c) => c.startsWith('colibri_session='));
    return { header: header ?? '', pair: header?.split(';')[0] ?? '' };
  };

  it('las rutas con datos del negocio piden sesión', async () => {
    const base = await start(configured, undefined, { signedIn: false });
    for (const path of ['/api/conversations', '/api/channels', '/api/conversations/x/messages']) {
      const response = await fetch(base + path);
      expect(response.status).toBe(401);
      expect(await response.json()).toMatchObject({ code: 'UNAUTHENTICATED' });
    }
    const post = await fetch(`${base}/api/conversations/x/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Hola' }),
    });
    expect(post.status).toBe(401);
  });

  it('un token inventado no abre nada', async () => {
    const base = await start(configured, undefined, { signedIn: false });
    const response = await fetch(`${base}/api/conversations`, {
      headers: { Cookie: 'colibri_session=inventado' },
    });
    expect(response.status).toBe(401);
  });

  it('rechaza credenciales incorrectas sin enviar cookie', async () => {
    const base = await start(configured, undefined, { signedIn: false });
    const response = await login(base, { email: TEST_USER.email, password: 'mala-clave-1' });
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ code: 'INVALID_CREDENTIALS' });
    expect(cookieFrom(response).header).toBe('');
  });

  it('valida lo que se envía', async () => {
    const base = await start(configured, undefined, { signedIn: false });
    expect((await login(base, { email: '', password: '' })).status).toBe(400);
    expect((await login(base, {})).status).toBe(400);
  });

  it('inicia sesión con una cookie HttpOnly y da acceso', async () => {
    const base = await start(configured, undefined, { signedIn: false });
    const response = await login(base, TEST_USER);
    expect(response.status).toBe(200);

    const body = (await response.json()) as { user: Record<string, unknown> };
    expect(body.user).toMatchObject({ email: TEST_USER.email });
    expect(body.user).not.toHaveProperty('passwordHash');

    const { header, pair } = cookieFrom(response);
    expect(header).toMatch(/HttpOnly/i);
    expect(header).toMatch(/SameSite=Lax/i);
    expect(header).toMatch(/Path=\//);
    expect(header).not.toMatch(/Expires|Max-Age/i); // sin "mantener sesión": cookie de sesión

    const me = await fetch(`${base}/api/auth/me`, { headers: { Cookie: pair } });
    expect(me.status).toBe(200);
    expect(await me.json()).toMatchObject({ user: { email: TEST_USER.email } });
    const channels = await fetch(`${base}/api/channels`, { headers: { Cookie: pair } });
    expect(channels.status).toBe(200);
  });

  it('con "mantener sesión" la cookie tiene fecha de vencimiento', async () => {
    const base = await start(configured, undefined, { signedIn: false });
    const response = await login(base, { ...TEST_USER, rememberMe: true });
    expect(cookieFrom(response).header).toMatch(/Expires=/i);
  });

  it('/api/auth/me responde 401 sin sesión', async () => {
    const base = await start(configured, undefined, { signedIn: false });
    expect((await fetch(`${base}/api/auth/me`)).status).toBe(401);
  });

  it('cerrar sesión borra la cookie e invalida el token', async () => {
    const base = await start(configured, undefined, { signedIn: false });
    const { pair } = cookieFrom(await login(base, TEST_USER));

    const out = await fetch(`${base}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: pair },
    });
    expect(out.status).toBe(204);
    expect(cookieFrom(out).header).toMatch(/Expires=Thu, 01 Jan 1970/i);

    // Aunque alguien conserve la cookie vieja, ya no sirve.
    expect((await fetch(`${base}/api/auth/me`, { headers: { Cookie: pair } })).status).toBe(401);
  });

  it('frena los intentos repetidos de adivinar la contraseña', async () => {
    const base = await start(configured, undefined, { signedIn: false });
    let last = 0;
    for (let i = 0; i < 21; i++) {
      last = (await login(base, { email: TEST_USER.email, password: `mala-clave-${i}` })).status;
    }
    expect(last).toBe(429);
  }, 20_000);

  it('el webhook de Meta sigue sin pedir sesión (se protege con la firma)', async () => {
    const base = await start(configured, undefined, { signedIn: false });
    const body = webhookBody('wamid.open');
    const response = await fetch(`${base}/api/webhooks/whatsapp`, {
      method: 'POST',
      headers: signed(body),
      body,
    });
    expect(response.status).toBe(200);
  });
});

describe('perfil y negocio', () => {
  const profile = {
    user: { name: '  Ana Mora ', role: 'Gerente' },
    business: { name: 'Café Pura Vida', address: '' },
  };
  const put = (base: string, body: unknown) =>
    api(`${base}/api/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('exige sesión', async () => {
    const base = await start(configured, undefined, { signedIn: false });
    expect((await fetch(`${base}/api/business`)).status).toBe(401);
    expect((await put(base, profile)).status).toBe(401);
  });

  it('el negocio viene vacío (null) hasta que se guarda', async () => {
    const base = await start(configured);
    const res = await api(`${base}/api/business`);
    expect(await res.json()).toEqual({ name: null, region: null, address: null });
  });

  it('guarda el perfil y lo devuelve en /api/business y /api/auth/me', async () => {
    const base = await start(configured);
    const res = await put(base, profile);
    expect(res.status).toBe(200);
    const saved = (await res.json()) as { user: Record<string, unknown>; business: unknown };
    expect(saved.user).toMatchObject({ name: 'Ana Mora', role: 'Gerente' });
    expect(saved.user).not.toHaveProperty('passwordHash');
    expect(saved.business).toEqual({ name: 'Café Pura Vida', region: null, address: null });

    expect(await (await api(`${base}/api/business`)).json()).toEqual(saved.business);
    const me = (await (await api(`${base}/api/auth/me`)).json()) as { user: unknown };
    expect(me.user).toMatchObject({ name: 'Ana Mora', role: 'Gerente' });
  });

  it('rechaza datos inválidos', async () => {
    const base = await start(configured);
    const bad = { ...profile, user: { name: '   ', role: 'Gerente' } };
    expect((await put(base, bad)).status).toBe(400);
    expect((await put(base, { user: profile.user })).status).toBe(400);
  });
});

describe('Instagram', () => {
  const igBody = (mid: string) =>
    JSON.stringify({
      object: 'instagram',
      entry: [
        {
          id: '999',
          messaging: [
            {
              sender: { id: 'igsid-1' },
              recipient: { id: '999' },
              timestamp: Date.now(),
              message: { mid, text: 'Hola por IG' },
            },
          ],
        },
      ],
    });
  const igSigned = (body: string, secret = configured.instagram.appSecret) => ({
    'Content-Type': 'application/json',
    'X-Hub-Signature-256': `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`,
  });

  it('verifica el webhook con su propio token', async () => {
    const base = await start(configured);
    const url = (token: string) =>
      `${base}/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=${token}&hub.challenge=77`;
    expect(await (await fetch(url('ig-verificacion'))).text()).toBe('77');
    expect((await fetch(url('token-verificacion'))).status).toBe(403);
  });

  it('responde 503 si Instagram no está configurado', async () => {
    const base = await start(unconfigured);
    expect((await fetch(`${base}/api/webhooks/instagram`)).status).toBe(503);
  });

  it('guarda el mensaje firmado con el nombre del contacto, sin duplicarlo', async () => {
    const base = await start(configured);
    const body = igBody('mid.1');
    for (let i = 0; i < 2; i++) {
      const res = await fetch(`${base}/api/webhooks/instagram`, {
        method: 'POST',
        headers: igSigned(body),
        body,
      });
      expect(res.status).toBe(200);
    }
    const list = (await (await api(`${base}/api/conversations`)).json()) as Record<
      string,
      unknown
    >[];
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      channel: 'instagram',
      contactId: 'igsid-1',
      contactName: 'Ana IG',
      lastMessagePreview: 'Hola por IG',
    });
  });

  it('rechaza una firma inválida', async () => {
    const base = await start(configured);
    const body = igBody('mid.2');
    const res = await fetch(`${base}/api/webhooks/instagram`, {
      method: 'POST',
      headers: igSigned(body, 'otro-secreto'),
      body,
    });
    expect(res.status).toBe(401);
    expect(await (await api(`${base}/api/conversations`)).json()).toEqual([]);
  });
});

describe('Messenger', () => {
  const fbBody = (mid: string, pageId = '555') =>
    JSON.stringify({
      object: 'page',
      entry: [
        {
          id: pageId,
          time: Date.now(),
          messaging: [
            {
              sender: { id: 'psid-1' },
              recipient: { id: pageId },
              timestamp: Date.now(),
              message: { mid, text: 'Hola por Messenger' },
            },
          ],
        },
      ],
    });
  const fbSigned = (body: string, secret = configured.messenger.appSecret) => ({
    'Content-Type': 'application/json',
    'X-Hub-Signature-256': `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`,
  });
  const post = (base: string, body: string, secret?: string) =>
    fetch(`${base}/api/webhooks/messenger`, {
      method: 'POST',
      headers: fbSigned(body, secret),
      body,
    });

  it('verifica el webhook con su propio token', async () => {
    const base = await start(configured);
    const url = (token: string) =>
      `${base}/api/webhooks/messenger?hub.mode=subscribe&hub.verify_token=${token}&hub.challenge=88`;
    expect(await (await fetch(url('fb-verificacion'))).text()).toBe('88');
    expect((await fetch(url('ig-verificacion'))).status).toBe(403);
  });

  it('responde 503 si Messenger no está configurado', async () => {
    const base = await start(unconfigured);
    expect((await fetch(`${base}/api/webhooks/messenger`)).status).toBe(503);
  });

  it('guarda el mensaje firmado con el nombre del contacto, sin duplicarlo', async () => {
    const base = await start(configured);
    const body = fbBody('m_1');
    for (let i = 0; i < 2; i++) expect((await post(base, body)).status).toBe(200);

    const list = (await (await api(`${base}/api/conversations`)).json()) as Record<
      string,
      unknown
    >[];
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      channel: 'messenger',
      contactId: 'psid-1',
      contactName: 'Luis FB',
      lastMessagePreview: 'Hola por Messenger',
    });
  });

  it('rechaza una firma inválida e ignora otras páginas', async () => {
    const base = await start(configured);
    expect((await post(base, fbBody('m_2'), 'otro-secreto')).status).toBe(401);
    expect((await post(base, fbBody('m_3', '999'))).status).toBe(200);
    expect(await (await api(`${base}/api/conversations`)).json()).toEqual([]);
  });
});

describe('ajustes del asistente', () => {
  const settings = {
    rules: { hours: 'auto', complaints: 'never' },
    blockedTopics: [' Tratamientos médicos ', 'tratamientos MÉDICOS', 'Descuentos'],
    tone: 'profesional',
    treatment: 'vos',
    signature: '  ',
    autoReplyPaused: false,
  };
  const put = (base: string, body: unknown) =>
    api(`${base}/api/assistant`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('exige sesión', async () => {
    const base = await start(configured, undefined, { signedIn: false });
    expect((await fetch(`${base}/api/assistant`)).status).toBe(401);
    expect((await put(base, settings)).status).toBe(401);
  });

  it('empieza con valores iniciales y la bienvenida sin completar', async () => {
    const base = await start(configured);
    const body = (await (await api(`${base}/api/assistant`)).json()) as Record<string, unknown>;
    expect(body).toMatchObject({
      tone: 'cercano',
      treatment: 'usted',
      onboardingCompletedAt: null,
    });
    expect(body.rules).toMatchObject({ hours: 'auto', availability: 'ask' });
  });

  it('guarda, completa reglas faltantes, limpia temas repetidos y completa la bienvenida', async () => {
    const base = await start(configured);
    const res = await put(base, { ...settings, completeOnboarding: true });
    expect(res.status).toBe(200);
    const saved = (await res.json()) as Record<string, unknown>;
    expect(saved).toMatchObject({
      tone: 'profesional',
      treatment: 'vos',
      signature: null,
      blockedTopics: ['Tratamientos médicos', 'Descuentos'],
    });
    expect(saved.rules).toMatchObject({ hours: 'auto', complaints: 'never', pricing: 'auto' });
    expect(typeof saved.onboardingCompletedAt).toBe('string');
    expect(await (await api(`${base}/api/assistant`)).json()).toEqual(saved);
  });

  it('rechaza valores desconocidos', async () => {
    const base = await start(configured);
    expect((await put(base, { ...settings, tone: 'grosero' })).status).toBe(400);
    expect((await put(base, { ...settings, rules: { hours: 'siempre' } })).status).toBe(400);
    expect((await put(base, { ...settings, rules: { inventado: 'auto' } })).status).toBe(400);
  });
});

describe('estadísticas de conversaciones', () => {
  it('devuelve el tiempo promedio de respuesta (null sin datos) y exige sesión', async () => {
    const base = await start(configured, undefined, { signedIn: false });
    expect((await fetch(`${base}/api/conversations/stats`)).status).toBe(401);
    await new Promise<void>((resolve) => server?.close(() => resolve()));

    const signed = await start(configured);
    expect(await (await api(`${signed}/api/conversations/stats`)).json()).toEqual({
      days: 7,
      responseTime: { averageSeconds: null, samples: 0 },
      autoReplies: 0,
    });
  });
});

describe('información del negocio', () => {
  const knowledge = {
    hours: {
      days: {
        mon: { open: '08:00', close: '18:00' },
        tue: { open: '08:00', close: '18:00' },
        wed: null,
        thu: null,
        fri: null,
        sat: 'closed',
        sun: 'closed',
      },
      notes: '  ',
    },
    location: { address: 'Barrio Escalante', landmarks: null, mapsUrl: 'https://waze.com/ul/x' },
    payments: { methods: 'efectivo', sinpeNumber: '8888 7777', sinpeName: 'Ana', prices: null },
    shipping: null,
    availability: null,
    orders: null,
    templates: { location: 'Estamos en {direccion}. {mapa}', hours: '' },
  };
  const put = (base: string, body: unknown) =>
    api(`${base}/api/knowledge`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('exige sesión y empieza vacía, con plantillas de fábrica que aún no están listas', async () => {
    const base = await start(configured, undefined, { signedIn: false });
    expect((await fetch(`${base}/api/knowledge`)).status).toBe(401);
    await new Promise<void>((resolve) => server?.close(() => resolve()));

    const signed = await start(configured);
    const body = (await (await api(`${signed}/api/knowledge`)).json()) as {
      knowledge: { location: { address: null } };
      topics: Record<string, { custom: boolean; preview: { ready: boolean; missing: string[] } }>;
    };
    expect(body.knowledge.location.address).toBeNull();
    expect(Object.keys(body.topics)).toEqual([
      'hours',
      'location',
      'pricing',
      'availability',
      'shipping',
      'orders',
    ]);
    expect(body.topics.location).toMatchObject({
      custom: false,
      preview: { ready: false, missing: ['Dirección'] },
    });
  });

  it('guarda, limpia los textos y usa la plantilla personalizada', async () => {
    const base = await start(configured);
    const res = await put(base, knowledge);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      knowledge: typeof knowledge;
      topics: Record<string, { custom: boolean; preview: { text: string; ready: boolean } }>;
    };
    expect(body.knowledge.hours.notes).toBeNull();
    expect(body.knowledge.payments.sinpeNumber).toBe('88887777');
    expect(body.knowledge.templates).toEqual({ location: 'Estamos en {direccion}. {mapa}' });
    expect(body.topics.location).toMatchObject({
      custom: true,
      preview: {
        text: 'Estamos en Barrio Escalante. Ubicación: https://waze.com/ul/x',
        ready: true,
      },
    });
    expect(body.topics.hours!.preview.ready).toBe(true);
    expect(body.topics.shipping!.preview.ready).toBe(false);
  });

  it('rechaza horas al revés, enlaces sin https, SINPE inválido y variables inventadas', async () => {
    const base = await start(configured);
    const with_ = (patch: (k: typeof knowledge) => void) => {
      const copy = structuredClone(knowledge);
      patch(copy);
      return put(base, copy);
    };
    expect(
      (await with_((k) => (k.hours.days.mon = { open: '18:00', close: '08:00' }))).status,
    ).toBe(400);
    expect((await with_((k) => (k.location.mapsUrl = 'http://x.com'))).status).toBe(400);
    expect((await with_((k) => (k.payments.sinpeNumber = '123'))).status).toBe(400);
    const res = await with_((k) => (k.templates.location = 'Llame al {telefono}'));
    expect(res.status).toBe(400);
    expect(((await res.json()) as { message: string }).message).toBe(
      'La plantilla usa un dato que no existe.',
    );
  });

  it('muestra la vista previa de una plantilla con un borrador sin guardarlo', async () => {
    const base = await start(configured);
    const res = await api(`${base}/api/knowledge/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template: '{saludo} {direccion} {otra}',
        knowledge: { ...knowledge, templates: { location: '{otra}' } },
      }),
    });
    expect(await res.json()).toEqual({
      text: '¡Hola! Con gusto le ayudo. Barrio Escalante {otra}',
      missing: [],
      unknown: ['otra'],
      ready: false,
    });
    const saved = (await (await api(`${base}/api/knowledge`)).json()) as {
      knowledge: { location: { address: null } };
    };
    expect(saved.knowledge.location.address).toBeNull();
  });
});
