import { z } from 'zod';
import type { LlmProvider, LlmRequest } from './llmProvider';

/**
 * Proveedor LLM de Anthropic (Claude). Usa la API de Mensajes por HTTP (`fetch`) para no agregar
 * dependencias y mantener cada proveedor como un adaptador delgado e intercambiable.
 */

interface AnthropicOptions {
  apiKey: string;
  model: string;
  /** URL base; vacío usa la oficial. Útil para pruebas o un gateway. */
  baseUrl?: string;
  /** Corta la espera si el servicio no responde (milisegundos). */
  timeoutMs?: number;
  /** Inyectable en pruebas para no llamar a la red. */
  fetchImpl?: typeof fetch;
}

// Versión de la API de Anthropic (cabecera obligatoria).
const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_BASE_URL = 'https://api.anthropic.com';
const DEFAULT_TIMEOUT_MS = 8000;

// Solo se leen los bloques de texto de la respuesta; el resto se ignora.
const responseSchema = z.object({
  content: z.array(z.object({ type: z.string(), text: z.string().optional() })),
});

export class AnthropicProvider implements LlmProvider {
  readonly id = 'anthropic';
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: AnthropicOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async complete({ system, user, maxTokens }: LlmRequest): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: maxTokens,
          // Clasificar un comentario no exige razonamiento profundo: esfuerzo bajo abarata y acelera.
          output_config: { effort: 'low' },
          system,
          messages: [{ role: 'user', content: user }],
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Anthropic respondió ${response.status}`);
      }
      const data: unknown = await response.json();
      return responseSchema
        .parse(data)
        .content.filter((block) => block.type === 'text')
        .map((block) => block.text ?? '')
        .join('')
        .trim();
    } finally {
      clearTimeout(timer);
    }
  }
}
