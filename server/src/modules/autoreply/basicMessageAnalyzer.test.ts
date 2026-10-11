import { describe, expect, it } from 'vitest';
import { BasicMessageAnalyzer, normalize } from './basicMessageAnalyzer';
import { describeMessageAnalyzer } from './messageAnalyzer.contract';

describeMessageAnalyzer('analizador básico', () => new BasicMessageAnalyzer());

describe('analizador básico', () => {
  const analyze = (text: string) =>
    new BasicMessageAnalyzer().analyze({ text, channel: 'instagram', blockedTopics: [] });

  it('normaliza tildes y signos', () => {
    expect(normalize('¿Dónde ESTÁN?')).toBe('donde estan');
  });

  it('reconoce cada tema', async () => {
    expect((await analyze('¿Cuánto cuesta el café?')).topic).toBe('pricing');
    expect((await analyze('¿Hacen envíos a Limón?')).topic).toBe('shipping');
    expect((await analyze('¿Todavía hay de la taza azul?')).topic).toBe('availability');
    expect((await analyze('Quiero hacer un encargo')).topic).toBe('orders');
  });

  it('baja la confianza si el mensaje mezcla temas', async () => {
    expect((await analyze('¿A qué hora abren?')).confidence).toBe(0.9);
    expect((await analyze('¿Dónde queda?')).confidence).toBe(0.8);
    expect((await analyze('¿Dónde quedan y cuánto cuesta el envío?')).confidence).toBe(0.5);
  });

  it('los reclamos ganan aunque haya otros temas', async () => {
    expect(await analyze('Pésimo servicio, ¿a qué hora abren para la devolución?')).toEqual({
      topic: 'complaints',
      confidence: 0.9,
      blocked: false,
    });
  });
});
