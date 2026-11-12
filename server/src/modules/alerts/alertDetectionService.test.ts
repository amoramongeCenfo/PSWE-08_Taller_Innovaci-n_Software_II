import { beforeEach, describe, expect, it } from 'vitest';
import { ConversationService } from '../conversations/conversationService';
import { MemoryConversationRepository } from '../conversations/memoryConversationRepository';
import { AlertDetectionService, shouldAlert } from './alertDetectionService';
import { BasicCommentAnalyzer } from './basicCommentAnalyzer';
import type { CommentAnalysis, CommentAnalyzer } from './commentAnalyzer';
import { MemoryAlertsRepository } from './memoryAlertsRepository';
import type { AlertSettings } from './types';

const NOW = new Date('2026-10-12T16:00:00Z');

/** Analizador fijo, para probar el servicio sin depender de palabras clave. */
class FixedAnalyzer implements CommentAnalyzer {
  constructor(public result: CommentAnalysis) {}
  async analyze() {
    return this.result;
  }
}

describe('detección de alertas sobre mensajes reales', () => {
  let conversations: ConversationService;
  let alerts: MemoryAlertsRepository;
  let log: string[];
  let counter = 0;

  const attach = (analyzer: CommentAnalyzer = new BasicCommentAnalyzer()) => {
    new AlertDetectionService(conversations, alerts, analyzer, {
      log: (line) => log.push(line),
    }).attach();
  };

  const receive = async (text: string | null, over: { externalId?: string } = {}) => {
    const result = await conversations.receive({
      channel: 'whatsapp',
      contactId: '50688887777',
      contactName: 'Ana Mora',
      externalId: over.externalId ?? `in-${++counter}`,
      type: text === null ? 'unsupported' : 'text',
      text,
      createdAt: new Date(NOW.getTime() - 1000).toISOString(),
    });
    await conversations.idle();
    return result;
  };

  beforeEach(() => {
    log = [];
    conversations = new ConversationService(new MemoryConversationRepository(), {}, () => NOW);
    alerts = new MemoryAlertsRepository();
  });

  it('crea una alerta nueva con la tarjeta completa cuando llega una acusación de estafa', async () => {
    attach();
    await receive('Esto es una estafa, me robaron el dinero');

    const created = await alerts.list('nueva');
    expect(created).toHaveLength(1);
    const [alert] = created;
    expect(alert).toMatchObject({
      channel: 'whatsapp',
      risk: 'alto',
      status: 'nueva',
      source: 'Mensaje directo de WhatsApp',
      postUrl: null,
      thread: [],
      comment: {
        author: 'Ana Mora',
        handle: '50688887777',
        text: 'Esto es una estafa, me robaron el dinero',
      },
    });
    expect(alert?.suggestedReply?.text).toBeTruthy();
    expect(Number.isNaN(Date.parse(alert!.detectedAt))).toBe(false);
  });

  it('no crea alerta con un mensaje normal', async () => {
    attach();
    await receive('¿A qué hora abren mañana?');
    expect(await alerts.list('nueva')).toHaveLength(0);
  });

  it('con sensibilidad "grave" no alerta por una queja leve', async () => {
    await alerts.saveSettings({ sensitivity: 'grave' });
    attach();
    await receive('No me respondieron el mensaje, mala atención');
    expect(await alerts.list('nueva')).toHaveLength(0);
  });

  it('con sensibilidad "todo" alerta también por señales leves', async () => {
    await alerts.saveSettings({ sensitivity: 'todo' });
    attach();
    await receive('No me respondieron el mensaje');
    expect(await alerts.list('nueva')).toHaveLength(1);
  });

  it('alerta por una palabra clave configurada por el negocio', async () => {
    await alerts.saveSettings({ keywords: ['mala experiencia'] });
    attach();
    await receive('Muy mala experiencia con este lugar');
    expect(await alerts.list('nueva')).toHaveLength(1);
  });

  it('no duplica la alerta si el canal repite el mismo mensaje', async () => {
    attach();
    await receive('Esto es una estafa', { externalId: 'wamid.repetido' });
    await receive('Esto es una estafa', { externalId: 'wamid.repetido' });
    expect(await alerts.list('nueva')).toHaveLength(1);
  });

  it('ignora los mensajes que no son texto', async () => {
    attach();
    await receive(null);
    expect(await alerts.list('nueva')).toHaveLength(0);
  });

  it('el registro de la decisión no incluye el texto del cliente', async () => {
    attach();
    await receive('Esto es una estafa, me robaron el dinero');
    expect(log).toHaveLength(1);
    expect(log[0]).toContain('riesgo alto');
    expect(log[0]).not.toContain('robaron');
  });

  it('usa la categoría del análisis para elegir la respuesta sugerida', async () => {
    attach(
      new FixedAnalyzer({ risk: 'medio', confidence: 0.7, triggers: ['x'], category: 'salud' }),
    );
    await receive('me cayó mal');
    const [alert] = await alerts.list('nueva');
    expect(alert?.risk).toBe('medio');
    expect(alert?.suggestedReply?.text).toContain('bienestar');
  });
});

describe('shouldAlert', () => {
  const settings = (sensitivity: AlertSettings['sensitivity']): AlertSettings => ({
    sensitivity,
    keywords: [],
    notifyByWhatsApp: false,
    whatsAppNumber: null,
  });
  const analysis = (risk: CommentAnalysis['risk'], confidence: number): CommentAnalysis => ({
    risk,
    confidence,
    triggers: confidence > 0 ? ['x'] : [],
    category: 'otro',
  });

  it('nunca alerta si la confianza es 0', () => {
    expect(shouldAlert(analysis('alto', 0), settings('todo'))).toBe(false);
  });

  it('alerta con riesgo medio o alto en cualquier sensibilidad', () => {
    for (const sensitivity of ['grave', 'normal', 'todo'] as const) {
      expect(shouldAlert(analysis('medio', 0.6), settings(sensitivity))).toBe(true);
      expect(shouldAlert(analysis('alto', 0.9), settings(sensitivity))).toBe(true);
    }
  });

  it('el riesgo bajo solo alerta con sensibilidad "todo"', () => {
    expect(shouldAlert(analysis('bajo', 0.4), settings('normal'))).toBe(false);
    expect(shouldAlert(analysis('bajo', 0.4), settings('todo'))).toBe(true);
  });
});
