export interface User {
  id: string;
  email: string;
  /** null mientras el dato no esté disponible; la interfaz muestra "N/A". */
  name: string | null;
  role: string | null;
}

/** Lo que la aplicación sabe de una sesión activa. */
export interface Session {
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
  /** Si es true, la sesión sobrevive al cierre del navegador. */
  rememberMe: boolean;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
