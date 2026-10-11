import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { FullScreenLoader } from '../../components/FullScreenLoader';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchAssistantSettings } from '../assistant';

/** Pantallas que se pueden abrir aunque la bienvenida no esté completa. */
const ALLOWED_BEFORE_ONBOARDING = ['/proximamente'];

/**
 * Si la bienvenida nunca se completó, lleva a /bienvenida. Si no se pueden leer los ajustes
 * (por ejemplo, el servidor no responde), deja pasar: la bienvenida no debe bloquear el trabajo.
 */
export function RequireOnboarding() {
  const dispatch = useAppDispatch();
  const { status, settings } = useAppSelector((state) => state.assistant);
  const { pathname } = useLocation();

  useEffect(() => {
    void dispatch(fetchAssistantSettings());
  }, [dispatch]);

  if (status === 'idle' || status === 'loading') {
    return <FullScreenLoader label="Preparando tu espacio…" />;
  }

  const pending = settings !== null && settings.onboardingCompletedAt === null;
  if (pending && !ALLOWED_BEFORE_ONBOARDING.includes(pathname)) {
    return <Navigate to="/bienvenida" replace />;
  }

  return <Outlet />;
}
