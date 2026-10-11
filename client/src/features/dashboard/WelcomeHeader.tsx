import { Icon } from '../../components/Icon';
import { IconButton } from '../../components/ui';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchBusinessProfile } from '../business';
import { formatToday, getFirstName, getGreeting } from './greeting';

/** Bienvenida de la pantalla de inicio: saludo, resumen, fecha y botón de actualizar. */
export function WelcomeHeader() {
  const dispatch = useAppDispatch();
  const userName = useAppSelector((state) => state.auth.user?.name ?? null);
  const region = useAppSelector((state) => state.business.profile?.region ?? null);
  const isRefreshing = useAppSelector((state) => state.business.status === 'loading');

  const now = new Date();
  const firstName = getFirstName(userName);
  const greeting = firstName ? `${getGreeting(now)}, ${firstName}` : getGreeting(now);

  return (
    <header className="flex flex-col justify-between gap-space-md md:flex-row md:items-end">
      <div className="flex min-w-0 flex-col gap-space-xs">
        <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
          Panel central
        </span>
        <h1 className="font-display-lg text-display-lg tracking-tight text-on-surface">
          {greeting}
        </h1>
        <p className="max-w-3xl font-body-lg text-body-lg text-on-surface-variant">
          Resumen de atención y mensajes de tu negocio hoy{region ? ` en ${region}` : ''}.
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-space-sm">
        <div className="flex h-11 items-center gap-space-sm rounded-xl bg-surface-container-lowest px-space-md font-body-md text-body-md font-medium text-primary shadow-card">
          <Icon name="calendar_today" />
          <span>{formatToday(now)}</span>
        </div>
        <IconButton
          icon="sync"
          label="Actualizar datos"
          disabled={isRefreshing}
          onClick={() => void dispatch(fetchBusinessProfile({ force: true }))}
          className="h-11 w-11 rounded-xl bg-surface-container-lowest text-primary shadow-card"
        />
      </div>
    </header>
  );
}
