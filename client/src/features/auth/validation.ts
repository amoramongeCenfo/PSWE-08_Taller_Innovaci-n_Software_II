import type { LoginCredentials } from './types';

export interface LoginFieldErrors {
  email?: string;
  password?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Valida el formulario de login y devuelve un mensaje por cada campo con problema. */
export function validateLogin({
  email,
  password,
}: Pick<LoginCredentials, 'email' | 'password'>): LoginFieldErrors {
  const errors: LoginFieldErrors = {};

  if (!email.trim()) {
    errors.email = 'Escribe tu correo electrónico.';
  } else if (!EMAIL_PATTERN.test(email.trim())) {
    errors.email = 'Revisa el correo, parece que le falta algo. Ejemplo: nombre@negocio.cr';
  }

  if (!password) {
    errors.password = 'Escribe tu contraseña.';
  }

  return errors;
}
