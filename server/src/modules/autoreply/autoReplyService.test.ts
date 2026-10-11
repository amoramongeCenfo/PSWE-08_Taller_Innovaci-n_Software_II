import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryAssistantRepository } from '../assistant/memoryAssistantRepository';
import { DEFAULT_SETTINGS, type AssistantSettings } from '../assistant/types';
import { ConversationService, type ChannelSender } from '../conversations/conversationService';
import { MemoryConversationRepository } from '../conversations/memoryConversationRepository';
import { SAMPLE_KNOWLEDGE } from '../knowledge/knowledgeRepository.contract';
import { MemoryKnowledgeRepository } from '../knowledge/memoryKnowledgeRepository';
import { MemoryBusinessRepository } from '../profile/memoryBusinessRepository';
import { AutoReplyService, describeDecision } from './autoReplyService';
import { BasicMessageAnalyzer } from './basicMessageAnalyzer';
import type { MessageAnalysis, MessageAnalyzer } from './messageAnalyzer';
import { ReplyComposer } from './replyComposer';

const NOW = new Date('2026-10-12T16:00:00Z'); // lunes 10 a. m. en Costa Rica

/** Analizador fijo, para probar el motor sin depender de palabras clave. */
class FixedAnalyzer implements MessageAnalyzer {
  constructor(public result: MessageAnalysis) {}
  async analyze() {
    return this.result;
  }
}

describe('motor "Contesta solo"', () => {
  let sent: { to: string; text: string }[];
  let sender: ChannelSender;
  let conversations: ConversationService;
  let assistant: MemoryAssistantRepository;
  let knowledge: MemoryKnowledgeRepository;
  let analyzer: FixedAnalyzer;
  let engine: AutoReplyService;
  let log: string[];
  let counter = 0;

  const settings = (over: Partial<AssistantSettings> = {}) => {
    const merged: Partial<AssistantSettings> = { ...DEFAULT_SETTINGS, ...over };
    delete merged.onboardingCompletedAt;
    return assistant.save(merged as Omit<AssistantSettings, 'onboardingCompletedAt'>, null);
  };

  const receive = (text: string, contactId = '506') =>
    conversations.receive({
      channel: 'whatsapp',
      contactId,
      contactName: 'Ana',
      externalId: `in-${++counter}`,
      type: 'text',
      text,
      createdAt: new Date(NOW.getTime() - 1000).toISOString(),
    });

  const messages = async (contactId = '506') => {
    const conversation = (await conversations.list()).find((c) => c.contactId === contactId)!;
    return conversations.listMessages(conversation.id);
  };

  beforeEach(async () => {
    sent = [];
    sender = {
      sendText: async (to, text) => {
        sent.push({ to, text });
        return { externalId: `out-${++counter}` };
      },
    };
    conversations = new ConversationService(
      new MemoryConversationRepository(),
      { whatsapp: sender },
      () => NOW,
    );
    assistant = new MemoryAssistantRepository();
    knowledge = new MemoryKnowledgeRepository();
    await knowledge.save(SAMPLE_KNOWLEDGE);
    const business = new MemoryBusinessRepository();
    await business.save({ name: 'Café Pura Vida', address: null });
    analyzer = new FixedAnalyzer({ topic: 'hours', confidence: 0.9, blocked: false });
    log = [];
    const composer = new ReplyComposer(
      knowledge,
      assistant,
      business,
      'America/Costa_Rica',
      () => NOW,
    );
    engine = new AutoReplyService(conversations, assistant, analyzer, composer, {
      minConfidence: 0.7,
      log: (line) => log.push(line),
    });
    engine.attach();
  });

  it('contesta solo con la información del negocio y lo marca como de Colibri', async () => {
    await receive('¿A qué hora abren?');
    await conversations.idle();
    expect(sent).toHaveLength(1);
    expect(sent[0]!.text).toContain('Hoy estamos abiertos hasta las 6 p. m.');
    const [inbound, reply] = await messages();
    expect(inbound!.author).toBe('customer');
    expect(reply).toMatchObject({ author: 'colibri', direction: 'outbound', status: 'sent' });
    expect(log).toEqual(['Contesta solo: horario, confianza 0.90, enviado']);
    expect(await conversations.autoReplies(7)).toBe(1);
  });

  it.each([
    [
      'en pausa',
      async () => settings({ autoReplyPaused: true }),
      'respuestas automáticas en pausa',
    ],
    [
      'tema prohibido',
      async () => (analyzer.result = { topic: 'hours', confidence: 0.9, blocked: true }),
      'tema prohibido',
    ],
    [
      'sin tema',
      async () => (analyzer.result = { topic: null, confidence: 0, blocked: false }),
      'sin tema reconocido',
    ],
    [
      'confianza baja',
      async () => (analyzer.result = { topic: 'hours', confidence: 0.6, blocked: false }),
      'confianza baja',
    ],
    [
      'reclamo',
      async () => {
        await settings({ rules: { ...DEFAULT_SETTINGS.rules, complaints: 'auto' } });
        analyzer.result = { topic: 'complaints', confidence: 1, blocked: false };
      },
      'los reclamos nunca se contestan solos',
    ],
    [
      'regla en "Me pregunta"',
      async () => settings({ rules: { ...DEFAULT_SETTINGS.rules, hours: 'ask' } }),
      'la consulta no está en "Contesta solo"',
    ],
    [
      'falta información',
      async () => {
        await settings({ rules: { ...DEFAULT_SETTINGS.rules, availability: 'auto' } });
        analyzer.result = { topic: 'availability', confidence: 0.9, blocked: false };
      },
      'falta información',
    ],
  ])('no contesta: %s', async (_name, prepare, reason) => {
    await prepare();
    await receive('Hola');
    await conversations.idle();
    expect(sent).toHaveLength(0);
    expect(log[0]).toContain(`no enviado: ${reason}`);
    const pending = (await conversations.list())[0]!;
    expect(pending.awaitingSince).not.toBeNull();
  });

  it('responde una sola vez por turno aunque lleguen dos mensajes seguidos', async () => {
    await Promise.all([receive('¿A qué hora abren?'), receive('¿Hasta qué hora?')]);
    await conversations.idle();
    expect(sent).toHaveLength(1);
    expect(log).toEqual([
      'Contesta solo: horario, confianza 0.90, enviado',
      'Contesta solo: horario, confianza 0.90, no enviado: ya se respondió en este turno',
    ]);
  });

  it('si el canal falla, no se guarda nada y la conversación queda pendiente', async () => {
    sender.sendText = async () => {
      throw new Error('caído');
    };
    await receive('¿A qué hora abren?');
    await conversations.idle();
    expect(log).toEqual([]);
    expect(await messages()).toHaveLength(1);
  });

  it('no reacciona a mensajes repetidos ni a mensajes sin texto', async () => {
    await receive('¿A qué hora abren?');
    await conversations.receive({
      channel: 'whatsapp',
      contactId: '506',
      contactName: 'Ana',
      externalId: `in-${counter}`,
      type: 'text',
      text: 'repetido',
      createdAt: NOW.toISOString(),
    });
    await conversations.receive({
      channel: 'whatsapp',
      contactId: '507',
      contactName: 'Luis',
      externalId: 'img-1',
      type: 'unsupported',
      text: null,
      createdAt: NOW.toISOString(),
    });
    await conversations.idle();
    expect(sent).toHaveLength(1);
  });

  it('funciona de punta a punta con el analizador básico', async () => {
    const service = new ConversationService(
      new MemoryConversationRepository(),
      { whatsapp: sender },
      () => NOW,
    );
    const composer = new ReplyComposer(
      knowledge,
      assistant,
      new MemoryBusinessRepository(),
      'America/Costa_Rica',
      () => NOW,
    );
    new AutoReplyService(service, assistant, new BasicMessageAnalyzer(), composer, {
      minConfidence: 0.7,
      log: (line) => log.push(line),
    }).attach();
    conversations = service;

    await receive('¿Dónde están ubicados?');
    await receive('Quiero poner un reclamo');
    await service.idle();
    expect(sent).toHaveLength(1);
    expect(sent[0]!.text).toContain('Estamos en Barrio Escalante');
    expect(log).toEqual([
      'Contesta solo: ubicación, confianza 0.90, enviado',
      'Contesta solo: reclamos, confianza 0.90, no enviado: los reclamos nunca se contestan solos',
    ]);
  });
});

describe('describeDecision', () => {
  it('no incluye el texto del cliente', () => {
    expect(describeDecision({ sent: false, reason: 'paused', topic: null, confidence: null })).toBe(
      'Contesta solo: no enviado: respuestas automáticas en pausa',
    );
  });
});
