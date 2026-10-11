import { LoginForm } from '../features/auth';

export function LoginPage() {
  return (
    <div className="flex flex-col gap-space-lg">
      <header className="flex flex-col gap-space-xs">
        <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
          Inicia sesión
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Entra a tu cuenta para atender a tus clientes.
        </p>
      </header>
      <LoginForm />
    </div>
  );
}
