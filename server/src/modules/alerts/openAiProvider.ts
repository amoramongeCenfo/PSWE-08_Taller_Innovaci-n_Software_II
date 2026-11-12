import { z } from 'zod';
import type { LlmProvider, LlmRequest } from './llmProvider';

/**
 * Proveedor LLM de OpenAI. Existe para demostrar que cambiar de fabricante es solo elegir otro
 * adaptador: implementa la misma interfaz `LlmProvider` que `AnthropicProvider`. El analizador y el
 * motor de alertas no distinguen cuál se usa.
 */

interface OpenAiOptions {
  apiKey: string;
  model: string;
  /** URL base; vacío usa la oficial. Útil para pruebas o un gateway compatible. */
  baseUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

const DEFAULT_BASE_URL = 'https://api.openai.com';
const DEFAULT_TIMEOUT_MS = 8000;

const responseSchema = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string().nullable() }) })).min(1),
});

export class OpenAiProvider implements LlmProvider {
  readonly id = 'openai';
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: OpenAiOptions) {
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
      const response = await this.fetchImpl(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: maxTokens,
          // Clasificación determinista: sin creatividad y con respuesta en JSON.
          temperature: 0,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`OpenAI respondió ${response.status}`);
      }
      const data: unknown = await response.json();
      return (responseSchema.parse(data).choices[0]?.message.content ?? '').trim();
    } finally {
      clearTimeout(timer);
    }
  }
}
