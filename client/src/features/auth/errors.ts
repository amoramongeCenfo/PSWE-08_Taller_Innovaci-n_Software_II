export type AuthErrorCode = 'INVALID_CREDENTIALS' | 'TOO_MANY_ATTEMPTS' | 'NETWORK' | 'UNKNOWN';

/** Error esperado del proceso de autenticación. El backend real debe mapear sus respuestas a estos códigos. */
export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode) {
    super(code);
    this.name = 'AuthError';
    this.code = code;
  }
}

const messages: Record<AuthErrorCode, string> = {
  // Mensaje único para correo o contraseña incorrectos: no revela si la cuenta existe.
  INVALID_CREDENTIALS:
    'El correo o la contraseña no son correctos. Revisa los datos e inténtalo de nuevo.',
  TOO_MANY_ATTEMPTS: 'Hiciste demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  NETWORK: 'No pudimos conectarnos. Revisa tu internet e inténtalo de nuevo.',
  UNKNOWN: 'Algo salió mal de nuestro lado. Inténtalo de nuevo en unos minutos.',
};

/** Convierte cualquier error en un mensaje claro para la persona usuaria. */
export function getAuthErrorMessage(error: unknown): string {
  return messages[error instanceof AuthError ? error.code : 'UNKNOWN'];
}
