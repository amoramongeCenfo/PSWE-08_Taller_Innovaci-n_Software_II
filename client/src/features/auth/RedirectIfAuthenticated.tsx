import { Navigate, Outlet, useLocation } from 'react-router';
import { FullScreenLoader } from '../../components/FullScreenLoader';
import { getRedirectTarget } from './redirect';
import { useAuth } from './useAuth';

/** Para pantallas públicas (login): si ya hay sesión, redirige a la pantalla que se quería abrir. */
export function RedirectIfAuthenticated() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullScreenLoader label="Comprobando tu sesión…" />;

  if (status === 'authenticated') {
    return <Navigate to={getRedirectTarget(location.state)} replace />;
  }

  return <Outlet />;
}
