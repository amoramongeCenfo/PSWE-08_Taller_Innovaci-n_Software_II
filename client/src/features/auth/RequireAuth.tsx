import { Navigate, Outlet, useLocation } from 'react-router';
import { FullScreenLoader } from '../../components/FullScreenLoader';
import { useAuth } from './useAuth';

/** Ruta protegida: solo deja pasar a quien tiene sesión. Si no, lleva al login y recuerda a dónde iba. */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullScreenLoader label="Comprobando tu sesión…" />;

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return <Outlet />;
}
