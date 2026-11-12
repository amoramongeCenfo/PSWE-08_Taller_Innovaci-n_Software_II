import { describe, expect, it } from 'vitest';
import type { CommentAnalyzer } from './commentAnalyzer';

/**
 * Pruebas que cualquier analizador de comentarios debe pasar.
 *
 * Uso — el área de análisis crea un archivo `miAnalizador.test.ts` con:
 *   describeCommentAnalyzer('mi analizador', () => new MiAnalizador())
 *
 * Sigue el mismo patrón de contrato que `describeMessageAnalyzer` en autoreply.
 */
export function describeCommentAnalyzer(name: string, create: () => CommentAnalyzer): void {
  describe(`${name} (contrato del analizador de comentarios)`, () => {
    const analyze = (text: string, keywords: string[] = []) =>
      create().analyze({ text, channel: 'whatsapp', keywords, sensitivity: 'normal' });

    it('devuelve un resultado válido con cualquier texto (vacío, emojis, muy largo)', async () => {
      const RISK_LEVELS = new Set(['alto', 'medio', 'bajo']);
      for (const text of ['', '   ', '👍🙏', '?', 'a'.repeat(5000), 'Hola, buenas tardes']) {
        const result = await analyze(text);
        expect(RISK_LEVELS.has(result.risk)).toBe(true);
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
        expect(Array.isArray(result.triggers)).toBe(true);
      }
    });

    it('sin riesgo detectado, la confianza es 0 y los disparadores están vacíos', async () => {
      const result = await analyze('¿A qué hora abren mañana?');
      expect(result.confidence).toBe(0);
      expect(result.triggers).toHaveLength(0);
    });

    it('detecta acusaciones de estafa como riesgo alto con confianza > 0.7', async () => {
      const result = await analyze('Esto es una estafa, me robaron el dinero');
      expect(result.risk).toBe('alto');
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.triggers.length).toBeGreaterThan(0);
    });

    it('detecta quejas de calidad o atención como riesgo medio o alto', async () => {
      const result = await analyze('El producto vino quebrado y la atención fue pésima');
      expect(['alto', 'medio']).toContain(result.risk);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('dispara alerta por palabra clave del negocio sin importar mayúsculas ni tildes', async () => {
      const result = await analyze('Muy mala experiencia con este lugar', ['mala experiencia']);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.triggers.length).toBeGreaterThan(0);
    });

    it('con sensibilidad "grave" solo detecta riesgos altos; las quejas leves no pasan', async () => {
      const result = await create().analyze({
        text: 'No me respondieron el mensaje, mala atención',
        channel: 'whatsapp',
        keywords: [],
        sensitivity: 'grave',
      });
      expect(result.risk).not.toBe('alto');
      expect(result.confidence).toBe(0);
    });

    it('con sensibilidad "todo" detecta señales leves', async () => {
      const result = await create().analyze({
        text: 'No me respondieron el mensaje',
        channel: 'instagram',
        keywords: [],
        sensitivity: 'todo',
      });
      expect(result.confidence).toBeGreaterThan(0);
    });
  });
}
