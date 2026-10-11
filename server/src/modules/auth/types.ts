export interface AuthUser {
  id: string;
  email: string;
  /** null mientras el dato no esté disponible; la interfaz muestra "N/A". */
  name: string | null;
  role: string | null;
}

/** Usuario tal como se guarda: incluye el hash de la contraseña, que nunca sale del servidor. */
export interface StoredUser extends AuthUser {
  passwordHash: string;
}

export interface NewUser {
  email: string;
  passwordHash: string;
  name: string | null;
  role: string | null;
}

export interface NewSession {
  /** Hash (SHA-256) del token. El token en sí solo vive en la cookie de la persona. */
  tokenHash: string;
  userId: string;
  expiresAt: string;
}

export interface StoredSession {
  user: AuthUser;
  expiresAt: string;
}

/** Lo que la persona edita de sí misma desde la pantalla Perfil. */
export interface UserProfile {
  name: string;
  role: string;
}
