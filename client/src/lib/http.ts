/** Error de una llamada a la API. Su mensaje ya está en español y se puede mostrar tal cual. */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

/**
 * Registra qué hacer cuando el servidor dice que la sesión ya no es válida (por ejemplo, venció
 * mientras la persona usaba la aplicación). Se configura una sola vez al arrancar.
 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler;
}

const NETWORK_ERROR = new ApiError('NETWORK', 'No pudimos conectar con el servidor.', 0);

function isErrorBody(value: unknown): value is { code: string; message: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { code?: unknown }).code === 'string' &&
    typeof (value as { message?: unknown }).message === 'string'
  );
}

/**
 * Llama a la API de Colibri y devuelve el JSON. Si algo falla lanza un ApiError.
 * En desarrollo, webpack redirige /api al servidor (puerto 3001).
 */
export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch {
    throw NETWORK_ERROR;
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && isErrorBody(body) && body.code === 'UNAUTHENTICATED') {
      onUnauthorized?.();
    }
    throw isErrorBody(body)
      ? new ApiError(body.code, body.message, response.status)
      : new ApiError('UNKNOWN', 'Ocurrió un error inesperado.', response.status);
  }
  return body as T;
}

/** Mensaje listo para mostrar a partir de cualquier error. */
export function getErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.';
}
