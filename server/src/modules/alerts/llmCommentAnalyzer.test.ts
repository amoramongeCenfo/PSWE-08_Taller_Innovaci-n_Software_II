import { describe, expect, it } from 'vitest';
import { BasicCommentAnalyzer } from './basicCommentAnalyzer';
import type { CommentAnalysisInput } from './commentAnalyzer';
import { describeCommentAnalyzer } from './commentAnalyzer.contract';
import { LlmCommentAnalyzer } from './llmCommentAnalyzer';
import type { LlmProvider, LlmRequest } from './llmProvider';

/** Proveedor de prueba que devuelve siempre la misma respuesta, sin tocar la red. */
class FakeProvider implements LlmProvider {
  readonly id = 'fake';
  constructor(private readonly reply: string | (() => string)) {}
  async complete(_request: LlmRequest): Promise<string> {
    return typeof this.reply === 'function' ? this.reply() : this.reply;
  }
}

/** Proveedor que falla, para verificar que el análisis cae al respaldo por palabras clave. */
class BrokenProvider implements LlmProvider {
  readonly id = 'broken';
  async complete(): Promise<string> {
    throw new Error('servicio caído');
  }
}

const input = (over: Partial<CommentAnalysisInput> = {}): CommentAnalysisInput => ({
  text: 'texto',
  channel: 'whatsapp',
  keywords: [],
  sensitivity: 'normal',
  ...over,
});

// Con el LLM caído, el analizador se comporta como el de palabras clave: debe cumplir el contrato.
describeCommentAnalyzer(
  'LlmCommentAnalyzer (respaldo)',
  () =>
    new LlmCommentAnalyzer({
      provider: new BrokenProvider(),
      fallback: new BasicCommentAnalyzer(),
    }),
);

describe('LlmCommentAnalyzer (ruta con IA)', () => {
  const analyzerWith = (reply: string | (() => string)) =>
    new LlmCommentAnalyzer({
      provider: new FakeProvider(reply),
      fallback: new BasicCommentAnalyzer(),
    });

  it('interpreta el JSON del LLM y devuelve el riesgo clasificado', async () => {
    const analyzer = analyzerWith(
      '{"risk":"alto","confidence":0.9,"triggers":["me estafaron"],"category":"estafa"}',
    );
    const result = await analyzer.analyze(input({ text: 'Me estafaron, no entregaron nada' }));
    expect(result.risk).toBe('alto');
    expect(result.category).toBe('estafa');
    expect(result.confidence).toBeCloseTo(0.9);
    expect(result.triggers).toContain('me estafaron');
  });

  it('tolera respuestas con cercas de código y texto alrededor', async () => {
    const analyzer = analyzerWith(
      'Claro, aquí tienes:\n```json\n{"risk":"medio","confidence":0.7,"triggers":["pésima atención"],"category":"atencion"}\n```',
    );
    const result = await analyzer.analyze(input({ text: 'La atención fue pésima' }));
    expect(result.risk).toBe('medio');
    expect(result.category).toBe('atencion');
  });

  it('cae al respaldo por palabras clave si el LLM no devuelve JSON', async () => {
    const analyzer = analyzerWith('No sé qué responder.');
    const result = await analyzer.analyze(input({ text: 'Esto es una estafa, me robaron' }));
    // El respaldo (BasicCommentAnalyzer) detecta la estafa aunque el LLM haya fallado.
    expect(result.risk).toBe('alto');
    expect(result.triggers.length).toBeGreaterThan(0);
  });

  it('cae al respaldo si el JSON no cumple el esquema', async () => {
    const analyzer = analyzerWith('{"risk":"catastrofico","confidence":"mucha"}');
    const result = await analyzer.analyze(input({ text: 'producto vencido y en mal estado' }));
    expect(['alto', 'medio']).toContain(result.risk);
  });

  it('con sensibilidad "grave" descarta lo que el LLM marca como medio', async () => {
    const analyzer = analyzerWith(
      '{"risk":"medio","confidence":0.8,"triggers":["no contestan"],"category":"atencion"}',
    );
    const result = await analyzer.analyze(
      input({ text: 'No contestan nunca', sensitivity: 'grave' }),
    );
    expect(result.risk).toBe('bajo');
    expect(result.confidence).toBe(0);
    expect(result.triggers).toHaveLength(0);
  });

  it('fuerza alerta cuando aparece una palabra clave del negocio que el LLM ignoró', async () => {
    const analyzer = analyzerWith('{"risk":"bajo","confidence":0,"triggers":[],"category":"otro"}');
    const result = await analyzer.analyze(
      input({ text: 'Tuve una mala experiencia aquí', keywords: ['mala experiencia'] }),
    );
    expect(result.risk).toBe('medio');
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.triggers).toContain('mala experiencia');
  });

  it('sin disparadores no reporta riesgo aunque el LLM invente confianza', async () => {
    const analyzer = analyzerWith(
      '{"risk":"bajo","confidence":0.4,"triggers":[],"category":"otro"}',
    );
    const result = await analyzer.analyze(input({ text: '¿A qué hora abren?' }));
    expect(result.confidence).toBe(0);
    expect(result.triggers).toHaveLength(0);
  });

  it('no llama al LLM con texto vacío o solo signos', async () => {
    let called = false;
    const analyzer = new LlmCommentAnalyzer({
      provider: new FakeProvider(() => {
        called = true;
        return '{}';
      }),
      fallback: new BasicCommentAnalyzer(),
    });
    const result = await analyzer.analyze(input({ text: '   👍🙏  ' }));
    expect(called).toBe(false);
    expect(result.confidence).toBe(0);
  });
});
