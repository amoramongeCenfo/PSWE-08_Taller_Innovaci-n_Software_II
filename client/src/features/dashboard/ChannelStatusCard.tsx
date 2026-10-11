import { Icon } from '../../components/Icon';
import { Card } from '../../components/ui';
import { cx } from '../../lib/cx';
import { useAppSelector } from '../../store/hooks';
import { ChannelLogo, selectActiveChannels } from '../channels';
import { formatList } from './greeting';

/** Estado de los canales conectados. Sin canales, invita a conectarlos. */
export function ChannelStatusCard() {
  const active = useAppSelector(selectActiveChannels);
  const channels = active.map((channel) => channel.name);
  const hasChannels = channels.length > 0;

  return (
    <Card className="flex flex-col justify-between gap-space-md p-space-md md:flex-row md:items-center md:p-space-md">
      <div className="flex items-center gap-space-md">
        <div
          aria-hidden="true"
          className={cx(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
            hasChannels
              ? 'bg-secondary-fixed/30 text-secondary'
              : 'bg-surface-container-low text-outline',
          )}
        >
          <Icon name="hub" size={24} />
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-space-xs">
            <span
              aria-hidden="true"
              className={cx(
                'h-2 w-2 shrink-0 rounded-full',
                hasChannels ? 'bg-secondary' : 'bg-outline-variant',
              )}
            />
            <h2 className="font-headline-sm text-headline-sm text-on-surface">
              {hasChannels ? 'Canales sincronizados y activos' : 'Sin canales conectados'}
            </h2>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {hasChannels
              ? `Tu negocio está conectado a ${formatList(channels)}.`
              : 'Cuando conectes WhatsApp, Instagram o Messenger, los verás aquí.'}
          </p>
        </div>
      </div>

      {hasChannels && (
        <ul className="flex flex-wrap gap-space-sm" aria-label="Canales conectados">
          {active.map((channel) => (
            <li
              key={channel.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-lowest px-3 py-1 font-label-md text-label-md text-on-surface ring-1 ring-hairline"
            >
              <ChannelLogo channel={channel.id} size={14} />
              {channel.name}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
