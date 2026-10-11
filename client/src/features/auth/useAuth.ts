import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { login as loginThunk, logout as logoutThunk } from './authSlice';
import { AuthError } from './errors';
import type { AuthStatus, LoginCredentials, User } from './types';

interface UseAuthResult {
  status: AuthStatus;
  user: User | null;
  /** Inicia sesión. Si falla, lanza AuthError para que la pantalla muestre el mensaje. */
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

/** Punto de entrada de la interfaz a la sesión. Por dentro usa el store global. */
export function useAuth(): UseAuthResult {
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.auth.status);
  const user = useAppSelector((state) => state.auth.user);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const result = await dispatch(loginThunk(credentials));
      if (loginThunk.rejected.match(result)) {
        throw new AuthError(result.payload ?? 'UNKNOWN');
      }
    },
    [dispatch],
  );

  const logout = useCallback(async () => {
    await dispatch(logoutThunk());
  }, [dispatch]);

  return { status, user, login, logout };
}
