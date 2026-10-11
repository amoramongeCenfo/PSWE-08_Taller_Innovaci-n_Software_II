import { httpAuthService } from './httpAuthService';
import type { LoginCredentials, Session } from './types';

/**
 * Contrato entre la aplicación y el sistema de autenticación.
 * La interfaz y los componentes SOLO hablan con este contrato, nunca con cookies ni con fetch.
 *
 * Hoy lo implementa `httpAuthService` (servidor real). `mockAuthService` sigue disponible para
 * trabajar sin servidor: basta con cambiar el export de abajo. Endpoints:
 *   login      -> POST /api/auth/login   { email, password, rememberMe }
 *                 El servidor responde { user } y envía la cookie con `Set-Cookie`
 *                 (HttpOnly; SameSite=Lax). Si rememberMe es true, con fecha de vencimiento.
 *   getSession -> GET  /api/auth/me      Devuelve { user } o 401 si no hay sesión.
 *   logout     -> POST /api/auth/logout  El servidor borra la sesión y la cookie.
 */
export interface AuthService {
  /** Inicia sesión. Lanza AuthError si las credenciales no son válidas o falla la conexión. */
  login(credentials: LoginCredentials): Promise<Session>;
  /** Devuelve la sesión vigente o null si no hay ninguna. Se usa al abrir la aplicación. */
  getSession(): Promise<Session | null>;
  /** Cierra la sesión actual. */
  logout(): Promise<void>;
}

export const authService: AuthService = httpAuthService;
