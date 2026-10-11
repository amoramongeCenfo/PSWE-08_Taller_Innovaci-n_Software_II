import { Link } from 'react-router';
import { Icon } from '../../components/Icon';
import { cx } from '../../lib/cx';
import { comingSoonPath } from '../assistant';
import { getContactDetail, getContactLabel } from './contact';
import { ContactAvatar } from './ContactAvatar';
import { getChannelLabel } from './conversationStatus';
import type { Conversation } from './types';

const CHANNEL_CHIP: Record<Conversation['channel'], string> = {
  whatsapp: 'bg-secondary-fixed/30 text-on-secondary-fixed-variant',
  instagram: 'bg-[#ff0069]/10 text-[#b0004a]',
  messenger: 'bg-primary-fixed/50 text-on-primary-fixed-variant',
};

interface ThreadHeaderProps {
  conversation: Conversation;
}

const actionClass =
  'inline-flex h-10 items-center gap-space-xs rounded-xl px-space-sm font-label-md text-label-md font-semibold text-on-surface ring-1 ring-hairline hover:bg-surface-container-low lg:px-space-md';

/** Cabecera de la conversación: quién escribe, por qué canal y acciones. En móvil, botón de volver. */
export function ThreadHeader({ conversation }: ThreadHeaderProps) {
  const label = getContactLabel(conversation);
  const detail = getContactDetail(conversation);
  const channel = getChannelLabel(conversation.channel);

  return (
    <header className="flex items-center gap-space-sm border-b border-hairline px-space-md py-space-sm">
      <Link
        to="/mensajes"
        aria-label="Volver a las conversaciones"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container-high lg:hidden"
      >
        <Icon name="arrow_back" />
      </Link>
      <ContactAvatar conversation={conversation} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 flex-wrap items-center gap-x-space-sm gap-y-0.5">
          <h2 className="truncate font-headline-sm text-headline-sm text-on-surface">{label}</h2>
          <span
            className={cx(
              'truncate rounded-full px-2 py-0.5 font-label-sm text-label-sm font-semibold',
              CHANNEL_CHIP[conversation.channel],
            )}
          >
            {detail ? `${channel} (${detail})` : channel}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-space-xs">
        <Link to={comingSoonPath('Perfil del cliente')} className={actionClass}>
          <Icon name="person" size={18} />
          <span className="hidden xl:inline">Ver perfil del cliente</span>
          <span className="sr-only xl:hidden">Ver perfil del cliente</span>
        </Link>
        <Link to={comingSoonPath('Resolver conversación')} className={actionClass}>
          <Icon name="task_alt" size={18} />
          <span className="hidden xl:inline">Resolver conversación</span>
          <span className="sr-only xl:hidden">Resolver conversación</span>
        </Link>
      </div>
    </header>
  );
}
