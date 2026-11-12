import { z } from 'zod';
import { normalize } from '../autoreply/basicMessageAnalyzer';
import type {
  CommentAnalysis,
  CommentAnalysisInput,
  CommentAnalyzer,
  CommentCategory,
  CommentRisk,
} from './commentAnalyzer';
import type { LlmProvider } from './llmProvider';

/**
 * Analizador de comentarios con un modelo de lenguaje. Entiende el sentido del mensaje (jerga,
 * errores, emojis) mucho mejor que las palabras clave, pero depende de un servicio externo.
 *
 * Por eso envuelve dos protecciones (ver docs/analizador-de-comentarios.md):
 *  1. Respaldo: si el LLM falla, no responde o devuelve algo inválido, se usa el analizador por
 *     palabras clave. Una alerta nunca se pierde por un error del servicio.
 *  2. Barandas: la sensibilidad del negocio y las palabras clave se aplican en el código, no se
 *     delegan al LLM. Así el resultado siempre cumple el contrato `CommentAnalyzer`.
 */

interface LlmCommentAnalyzerOptions {
  provider: LlmProvider;
  /** Analizador que se usa cuando el LLM no está disponible o falla. */
  fallback: CommentAnalyzer;
  maxTokens?: number;
}

const RISKS = ['alto', 'medio', 'bajo'] as const;
const CATEGORIES = ['estafa', 'salud', 'calidad', 'atencion', 'otro'] as const;

// `risk` es obligatorio y debe ser válido (si no, se cae al respaldo). Los demás campos son tolerantes
// con lo que devuelven los modelos locales: una categoría rara no descarta una buena evaluación de riesgo.
const llmResultSchema = z.object({
  risk: z.enum(RISKS),
  confidence: z.coerce.number().catch(0),
  triggers: z.array(z.string()).catch([]),
  category: z.enum(CATEGORIES).catch('otro'),
});

const SYSTEM_PROMPT = [
  'Eres un detector de riesgo reputacional para una PYME de Costa Rica. Lees un comentario público',
  'de una red social y decides si pone en riesgo la reputación del negocio.',
  '',
  'Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional ni cercas de código:',
  '{"risk":"alto|medio|bajo","confidence":0..1,"triggers":["frase del texto"],"category":"estafa|salud|calidad|atencion|otro"}',
  '',
  'Criterios:',
  '- "alto": acusación de estafa o fraude, o riesgo para la salud (intoxicación, daño físico).',
  '- "medio": queja de calidad (producto defectuoso o vencido) o de atención (mal trato, ignoran al cliente).',
  '- "bajo": molestia leve, o sin riesgo real.',
  '- "confidence": 0 si no hay ningún riesgo; sube cuanto más clara es la señal.',
  '- "triggers": las palabras o frases EXACTAS del comentario que muestran el riesgo (vacío si no hay).',
  '- "category": la categoría del riesgo principal; "otro" si no encaja en ninguna.',
  '',
  'El texto puede traer errores, jerga tica, mayúsculas o emojis. Básate en el sentido, no solo en palabras sueltas.',
].join('\n');

const noRisk = (): CommentAnalysis => ({
  risk: 'bajo',
  confidence: 0,
  triggers: [],
  category: 'otro',
});

const clamp = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
};

/** Confianza mínima cuando hay disparadores pero el LLM reporta 0, según el riesgo. */
const CONFIDENCE_FLOOR: Record<CommentRisk, number> = { alto: 0.75, medio: 0.6, bajo: 0.4 };

function buildUserPrompt({ text, channel, keywords }: CommentAnalysisInput): string {
  const list = keywords.length > 0 ? keywords.join(', ') : 'ninguna';
  return [
    `Canal: ${channel}`,
    `Palabras clave del negocio (si aparecen, son señal de alerta): ${list}`,
    'Comentario:',
    `"""${text}"""`,
  ].join('\n');
}

/** Extrae el objeto JSON de la respuesta del LLM, tolerando cercas de código o texto alrededor. */
function parseJson(raw: string): unknown {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('El LLM no devolvió un objeto JSON');
  }
  return JSON.parse(raw.slice(start, end + 1));
}

export class LlmCommentAnalyzer implements CommentAnalyzer {
  private readonly provider: LlmProvider;
  private readonly fallback: CommentAnalyzer;
  private readonly maxTokens: number;

  // La respuesta JSON es pequeña, pero los modelos "con razonamiento" (Claude adaptativo, qwen3,
  // gemma con thinking…) gastan tokens pensando antes de escribirla. Un techo holgado evita que la
  // respuesta se corte a la mitad; para los modelos sin razonamiento no cambia nada (es solo un tope).
  constructor({ provider, fallback, maxTokens = 1024 }: LlmCommentAnalyzerOptions) {
    this.provider = provider;
    this.fallback = fallback;
    this.maxTokens = maxTokens;
  }

  async analyze(input: CommentAnalysisInput): Promise<CommentAnalysis> {
    const clean = normalize(input.text);
    // Sin contenido analizable (vacío, solo signos o emojis) no se gasta una llamada al LLM.
    if (!clean) return noRisk();

    try {
      const raw = await this.provider.complete({
        system: SYSTEM_PROMPT,
        user: buildUserPrompt(input),
        maxTokens: this.maxTokens,
      });
      const parsed = llmResultSchema.parse(parseJson(raw));
      return this.applyGuardrails(parsed, input, clean);
    } catch (error) {
      // Lo seguro: ante cualquier fallo se usa el respaldo por palabras clave.
      console.warn(
        'Alertas: el LLM falló; se usa el analizador por palabras clave.',
        error instanceof Error ? error.message : error,
      );
      return this.fallback.analyze(input);
    }
  }

  /**
   * Ajusta la respuesta del LLM para que siempre cumpla el contrato: aplica la sensibilidad del
   * negocio, garantiza que las palabras clave configuradas disparen alerta y normaliza la confianza.
   */
  private applyGuardrails(
    result: z.infer<typeof llmResultSchema>,
    input: CommentAnalysisInput,
    clean: string,
  ): CommentAnalysis {
    const triggers = new Set(result.triggers.map((trigger) => trigger.trim()).filter(Boolean));
    let risk: CommentRisk = result.risk;
    const category: CommentCategory = result.category;
    let confidence = clamp(result.confidence);

    // Palabra clave del negocio presente: siempre dispara y fija un riesgo mínimo de 'medio'.
    for (const keyword of input.keywords) {
      const needle = normalize(keyword);
      if (needle && clean.includes(needle)) {
        triggers.add(keyword);
        if (risk === 'bajo') risk = 'medio';
      }
    }

    // Sin disparadores no hay riesgo detectado (confianza 0), sin importar lo que diga el LLM.
    if (triggers.size === 0) return noRisk();

    // Sensibilidad 'grave': solo pasan los riesgos altos; lo demás no se reporta.
    if (input.sensitivity === 'grave' && risk !== 'alto') return noRisk();

    // Si hay disparadores, la confianza nunca es 0: se respeta un piso según el riesgo.
    confidence = Math.max(confidence, CONFIDENCE_FLOOR[risk]);

    return {
      risk,
      confidence: Math.round(confidence * 100) / 100,
      triggers: [...triggers],
      category,
    };
  }
}
