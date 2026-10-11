import { Spinner } from './ui';

/** Pantalla de espera a pantalla completa (por ejemplo, mientras se comprueba la sesión). */
export function FullScreenLoader({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div
      role="status"
      className="flex min-h-screen flex-col items-center justify-center gap-space-md text-on-surface-variant"
    >
      <Spinner size={32} className="text-primary-container" />
      <span className="font-body-md text-body-md">{label}</span>
    </div>
  );
}
