import { describe, expect, it } from 'vitest';
import { TOPIC_IDS } from '../assistant/types';
import type { MessageAnalyzer } from './messageAnalyzer';

/**
 * Pruebas que cualquier analizador debe pasar. Para el suyo, el área de análisis crea un archivo
 * `miAnalizador.test.ts` con: describeMessageAnalyzer('mi analizador', () => new MiAnalizador()).
 */
export function describeMessageAnalyzer(name: string, create: () => MessageAnalyzer): void {
  describe(`${name} (contrato del analizador)`, () => {
    const analyze = (text: string, blockedTopics: string[] = []) =>
      create().analyze({ text, channel: 'whatsapp', blockedTopics });

    const valid = (result: Awaited<ReturnType<typeof analyze>>) => {
      expect(result.topic === null || TOPIC_IDS.includes(result.topic)).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(typeof result.blocked).toBe('boolean');
    };

    it('devuelve un resultado válido con cualquier texto (vacío, emojis, muy largo)', async () => {
      for (const text of ['', '   ', '👍🙏', '?', 'a'.repeat(5000), 'Hola, buenas tardes']) {
        valid(await analyze(text));
      }
    });

    it('sin tema reconocido, la confianza es 0', async () => {
      const result = await analyze('');
      expect(result.topic).toBeNull();
      expect(result.confidence).toBe(0);
    });

    it('reconoce preguntas claras de horario y ubicación', async () => {
      expect((await analyze('¿A qué hora abren mañana?')).topic).toBe('hours');
      expect((await analyze('¿Dónde están ubicados?')).topic).toBe('location');
    });

    it('reconoce un reclamo', async () => {
      expect((await analyze('Quiero poner un reclamo, el pedido nunca llegó')).topic).toBe(
        'complaints',
      );
    });

    it('marca los temas prohibidos sin importar mayúsculas ni tildes', async () => {
      expect(
        (await analyze('¿Hacen tratamientos médicos?', ['Tratamientos medicos'])).blocked,
      ).toBe(true);
      expect((await analyze('¿A qué hora abren?', ['Tratamientos médicos'])).blocked).toBe(false);
    });
  });
}
