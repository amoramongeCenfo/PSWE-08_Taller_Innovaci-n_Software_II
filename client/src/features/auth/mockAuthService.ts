import { readProfileCookie } from '../profile/profileCookie';
import { AuthError } from './errors';
import { clearSessionCookie, readSessionCookie, writeSessionCookie } from './sessionCookie';
import type { AuthService } from './authService';
import type { User } from './types';

/**
 * Servicio de autenticación SIMULADO para desarrollar sin backend.
 * Credenciales de prueba:  demo@colibri.cr  /  colibri123
 *
 * El usuario simulado solo tiene correo: nombre y rol vienen en null a propósito,
 * para que la interfaz muestre "N/A" hasta que el backend entregue esos datos.
 */
const DEMO_EMAIL = 'demo@colibri.cr';
const DEMO_PASSWORD = 'colibri123';
const DEMO_USER: User = {
  id: 'usr_demo',
  email: DEMO_EMAIL,
  name: null,
  role: null,
};

const SIMULATED_LATENCY_MS = 600;

/** El usuario de prueba, con el nombre y el puesto guardados desde la pantalla Perfil. */
function getCurrentUser(): User {
  return { ...DEMO_USER, ...readProfileCookie()?.user };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createToken(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export const mockAuthService: AuthService = {
  async login({ email, password, rememberMe }) {
    await wait(SIMULATED_LATENCY_MS);

    const isValid = email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD;
    if (!isValid) throw new AuthError('INVALID_CREDENTIALS');

    writeSessionCookie({ token: createToken() }, rememberMe);
    return { user: getCurrentUser() };
  },

  async getSession() {
    const stored = readSessionCookie();
    // Los datos del usuario los entrega el servicio, no la cookie.
    return stored ? { user: getCurrentUser() } : null;
  },

  async logout() {
    clearSessionCookie();
  },
};
