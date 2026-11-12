/**
 * Contrato del proveedor de modelo de lenguaje (LLM), independiente del fabricante.
 *
 * Define lo mínimo que el analizador necesita: enviar una instrucción (`system`) y un texto
 * (`user`) y recibir la respuesta en texto plano. Cada proveedor (Anthropic, OpenAI, …) implementa
 * esta interfaz, así que cambiar de proveedor no toca el analizador ni el motor de alertas: solo
 * se elige otra implementación en `llmProviderFactory.ts`.
 */
export interface LlmRequest {
  /** Instrucción del sistema: define la tarea y el formato exacto de la respuesta. */
  system: string;
  /** Contenido a analizar (el comentario y su contexto). */
  user: string;
  /** Límite de tokens de la respuesta. */
  maxTokens: number;
}

export interface LlmProvider {
  /** Identificador legible, por ejemplo "anthropic" u "openai". Solo para registros. */
  readonly id: string;
  /** Envía la petición y devuelve el texto de la respuesta. Lanza si el servicio falla. */
  complete(request: LlmRequest): Promise<string>;
}
