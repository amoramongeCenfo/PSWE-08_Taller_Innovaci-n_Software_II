import { ApiError, apiRequest } from '../../lib/http';
import type { AuthService } from './authService';
import { AuthError, type AuthErrorCode } from './errors';
import type { Session, User } from './types';

function toAuthError(error: unknown): AuthError {
  if (!(error instanceof ApiError)) return new AuthError('UNKNOWN');
  const codes: Record<string, AuthErrorCode> = {
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    TOO_MANY_ATTEMPTS: 'TOO_MANY_ATTEMPTS',
    NETWORK: 'NETWORK',
  };
  return new AuthError(codes[error.code] ?? 'UNKNOWN');
}

/**
 * Autenticación real contra el servidor. La cookie de sesión la emite el servidor como HttpOnly:
 * el navegador la envía solo y ningún script de la página puede leerla.
 */
export const httpAuthService: AuthService = {
  async login({ email, password, rememberMe }): Promise<Session> {
    try {
      const { user } = await apiRequest<{ user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, rememberMe }),
      });
      return { user };
    } catch (error) {
      throw toAuthError(error);
    }
  },

  async getSession() {
    try {
      const { user } = await apiRequest<{ user: User }>('/auth/me');
      return { user };
    } catch (error) {
      // 401: no hay sesión (o venció). Es el caso normal de quien aún no inició sesión.
      if (error instanceof ApiError && error.status === 401) return null;
      throw toAuthError(error);
    }
  },

  async logout() {
    await apiRequest<null>('/auth/logout', { method: 'POST' });
  },
};
