import { Link } from 'react-router';
import { Icon } from '../../components/Icon';
import { Badge, Spinner } from '../../components/ui';
import { useAppSelector } from '../../store/hooks';
import { ChannelLogo } from '../channels';
import { comingSoonPath } from './comingSoon';

/** Paso 1: qué redes ya están conectadas. Los datos vienen del servidor (GET /api/channels). */
export function ChannelsOverview() {
  const { items, status } = useAppSelector((state) => state.channels);

  if (status === 'loading' || status === 'idle') {
    return (
      <div role="status" className="flex items-center gap-space-sm text-on-surface-variant">
        <Spinner /> Revisando tus redes…
      </div>
    );
  }
  if (status === 'error') {
    return (
      <p className="font-body-md text-body-md text-on-surface-variant">
        No pudimos revisar tus redes ahora. Puedes seguir y revisarlas luego en Mi negocio.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-space-sm">
      {items.map((channel) => {
        const active = channel.state === 'active';
        return (
          <li
            key={channel.id}
            className="flex flex-wrap items-center gap-space-md rounded-2xl bg-surface-container-lowest p-space-md shadow-hairline"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-low">
              <ChannelLogo channel={channel.id} size={22} />
            </span>
            <div className="flex min-w-[11rem] flex-1 flex-col">
              <span className="font-body-lg text-body-lg font-semibold text-on-surface">
                {channel.name}
              </span>
              <span className="font-body-md text-body-md text-on-surface-variant">
                {active
                  ? 'Recibes y respondes sus mensajes en Colibri.'
                  : 'Todavía no está conectado.'}
              </span>
            </div>
            {active ? (
              <Badge tone="success" icon="check_circle">
                Conectado
              </Badge>
            ) : (
              <Link
                to={comingSoonPath(`Conectar ${channel.name}`)}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 font-label-md text-label-md font-semibold text-primary hover:bg-primary-fixed/40"
              >
                Conectar
                <Icon name="arrow_forward" size={16} />
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
