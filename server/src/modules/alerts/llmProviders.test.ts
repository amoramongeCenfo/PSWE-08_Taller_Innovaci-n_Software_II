import { describe, expect, it, vi } from 'vitest';
import type { LlmConfig } from '../../config';
import { AnthropicProvider } from './anthropicProvider';
import { BasicCommentAnalyzer } from './basicCommentAnalyzer';
import { LlmCommentAnalyzer } from './llmCommentAnalyzer';
import { createCommentAnalyzer, createLlmProvider } from './llmProviderFactory';
import { OpenAiProvider } from './openAiProvider';

const config = (over: Partial<LlmConfig> = {}): LlmConfig => ({
  provider: '',
  apiKey: '',
  model: '',
  baseUrl: '',
  timeoutMs: 0,
  ...over,
});

/** Respuesta `fetch` simulada con el cuerpo JSON dado. */
const ok = (body: unknown): Response =>
  ({ ok: true, status: 200, json: async () => body }) as unknown as Response;

describe('AnthropicProvider', () => {
  it('envía la petición a la API de mensajes y devuelve el texto', async () => {
    const fetchImpl = vi.fn(async () =>
      ok({ content: [{ type: 'text', text: '{"risk":"bajo"}' }] }),
    ) as unknown as typeof fetch;
    const provider = new AnthropicProvider({ apiKey: 'k', model: 'claude-opus-5-5', fetchImpl });

    const text = await provider.complete({ system: 's', user: 'u', maxTokens: 100 });

    expect(text).toBe('{"risk":"bajo"}');
    const call = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0] ?? [];
    const [url, init] = call as [string, RequestInit & { headers: Record<string, string> }];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    expect(init.method).toBe('POST');
    expect(init.headers['x-api-key']).toBe('k');
  });

  it('lanza cuando la API responde con error', async () => {
    const fetchImpl = vi.fn(
      async () => ({ ok: false, status: 429 }) as Response,
    ) as unknown as typeof fetch;
    const provider = new AnthropicProvider({ apiKey: 'k', model: 'm', fetchImpl });
    await expect(provider.complete({ system: 's', user: 'u', maxTokens: 10 })).rejects.toThrow(
      '429',
    );
  });
});

describe('OpenAiProvider', () => {
  it('lee el contenido del primer "choice"', async () => {
    const fetchImpl = vi.fn(async () =>
      ok({ choices: [{ message: { content: '{"risk":"alto"}' } }] }),
    ) as unknown as typeof fetch;
    const provider = new OpenAiProvider({ apiKey: 'k', model: 'gpt-4o-mini', fetchImpl });

    const text = await provider.complete({ system: 's', user: 'u', maxTokens: 100 });

    expect(text).toBe('{"risk":"alto"}');
    const [url] = ((fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0] ?? []) as [
      string,
    ];
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
  });
});

describe('createLlmProvider', () => {
  it('devuelve null si no hay proveedor', () => {
    expect(createLlmProvider(config())).toBeNull();
  });

  it('devuelve null si falta la clave', () => {
    expect(createLlmProvider(config({ provider: 'anthropic' }))).toBeNull();
  });

  it('elige el proveedor por nombre (sin importar mayúsculas)', () => {
    expect(createLlmProvider(config({ provider: 'Anthropic', apiKey: 'k' }))).toBeInstanceOf(
      AnthropicProvider,
    );
    expect(createLlmProvider(config({ provider: 'openai', apiKey: 'k' }))).toBeInstanceOf(
      OpenAiProvider,
    );
  });

  it('devuelve null ante un proveedor desconocido', () => {
    expect(createLlmProvider(config({ provider: 'acme', apiKey: 'k' }))).toBeNull();
  });

  it('acepta Ollama sin clave (corre local) y requiere el modelo', () => {
    expect(createLlmProvider(config({ provider: 'ollama', model: 'llama3.1' }))).toBeInstanceOf(
      OpenAiProvider,
    );
    // Sin modelo no se puede: Ollama no tiene uno por defecto.
    expect(createLlmProvider(config({ provider: 'ollama' }))).toBeNull();
  });
});

describe('createCommentAnalyzer', () => {
  it('sin LLM configurado usa el analizador por palabras clave', () => {
    expect(createCommentAnalyzer(config())).toBeInstanceOf(BasicCommentAnalyzer);
  });

  it('con LLM configurado usa el analizador con IA', () => {
    expect(createCommentAnalyzer(config({ provider: 'anthropic', apiKey: 'k' }))).toBeInstanceOf(
      LlmCommentAnalyzer,
    );
  });
});
