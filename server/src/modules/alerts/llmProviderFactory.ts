import type { LlmConfig } from '../../config';
import { AnthropicProvider } from './anthropicProvider';
import { BasicCommentAnalyzer } from './basicCommentAnalyzer';
import type { CommentAnalyzer } from './commentAnalyzer';
import { LlmCommentAnalyzer } from './llmCommentAnalyzer';
import type { LlmProvider } from './llmProvider';
import { OpenAiProvider } from './openAiProvider';

/**
 * Punto único donde se elige el proveedor de LLM a partir de la configuración. Agregar otro
 * fabricante es escribir su adaptador (que implemente `LlmProvider`) y sumar un `case` aquí; nada
 * más del proyecto cambia.
 */

// Modelo por defecto de cada proveedor cuando no se fija `LLM_MODEL`.
// Ollama no tiene uno: depende de qué modelo haya descargado la persona.
const DEFAULT_MODEL: Record<string, string> = {
  anthropic: 'claude-opus-5-5',
  openai: 'gpt-4o-mini',
};

// URL local de Ollama por defecto.
const OLLAMA_BASE_URL = 'http://localhost:11434';
// Los modelos locales arrancan lentos (cargan en memoria), así que esperan más que los de la nube.
const OLLAMA_TIMEOUT_MS = 60000;

/** Timeout efectivo: lo configurado (`LLM_TIMEOUT_MS`) o el valor por defecto que se pase. */
const timeoutOr = (config: LlmConfig, fallbackMs: number): number =>
  config.timeoutMs > 0 ? config.timeoutMs : fallbackMs;

/** Crea el proveedor configurado, o `null` si no hay proveedor (o falta la clave donde hace falta). */
export function createLlmProvider(config: LlmConfig): LlmProvider | null {
  const provider = config.provider.trim().toLowerCase();
  if (!provider) return null;
  // Ollama corre en tu máquina y no usa clave; los servicios en la nube sí la exigen.
  if (provider !== 'ollama' && !config.apiKey) return null;

  const model = config.model || DEFAULT_MODEL[provider];
  const baseUrl = config.baseUrl || undefined;
  if (!model) {
    console.warn(
      `LLM_PROVIDER "${provider}" requiere definir LLM_MODEL. Se usa solo palabras clave.`,
    );
    return null;
  }

  switch (provider) {
    case 'anthropic':
      return new AnthropicProvider({
        apiKey: config.apiKey,
        model,
        baseUrl,
        timeoutMs: timeoutOr(config, 8000),
      });
    case 'openai':
      return new OpenAiProvider({
        apiKey: config.apiKey,
        model,
        baseUrl,
        timeoutMs: timeoutOr(config, 8000),
      });
    case 'ollama':
      // Ollama expone una API compatible con OpenAI, así que reusa ese adaptador apuntando a local.
      return new OpenAiProvider({
        apiKey: config.apiKey || 'ollama',
        model,
        baseUrl: config.baseUrl || OLLAMA_BASE_URL,
        timeoutMs: timeoutOr(config, OLLAMA_TIMEOUT_MS),
      });
    default:
      console.warn(`LLM_PROVIDER desconocido: "${provider}". Se usa solo palabras clave.`);
      return null;
  }
}

/**
 * Devuelve el analizador de comentarios que usa el motor de alertas. Con un LLM configurado se usa
 * ese (con el analizador por palabras clave como respaldo); sin configuración, solo palabras clave.
 */
export function createCommentAnalyzer(config: LlmConfig): CommentAnalyzer {
  const fallback = new BasicCommentAnalyzer();
  const provider = createLlmProvider(config);
  if (!provider) {
    console.log('Alertas: analizador por palabras clave (sin LLM configurado).');
    return fallback;
  }
  console.log(`Alertas: analizador con IA (${provider.id}), respaldo por palabras clave.`);
  return new LlmCommentAnalyzer({ provider, fallback });
}
