import { Outlet } from 'react-router';
import { Card, Logo } from '../../components/ui';

/**
 * Marco de las pantallas públicas sin menú (login y, más adelante, recuperar contraseña, registro).
 * Centra una tarjeta con el logo; la pantalla concreta se muestra en <Outlet />.
 */
export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center px-space-md py-space-xl">
      <main className="flex w-full max-w-md flex-col gap-space-lg">
        <div className="flex justify-center">
          <Logo size={44} />
        </div>
        <Card>
          <Outlet />
        </Card>
      </main>
    </div>
  );
}
