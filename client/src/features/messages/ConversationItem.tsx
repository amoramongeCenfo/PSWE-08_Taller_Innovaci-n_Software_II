import { NavLink } from 'react-router';
import { Icon } from '../../components/Icon';
import { cx } from '../../lib/cx';
import { getContactLabel } from './contact';
import { ContactAvatar } from './ContactAvatar';
import { formatListTime } from './time';
import type { Conversation } from './types';
import { formatWaiting, isLongWait } from './waiting';

interface ConversationItemProps {
  conversation: Conversation;
}

/** Una fila de la bandeja: quién, último mensaje, cuándo y si espera respuesta. */
export function ConversationItem({ conversation }: ConversationItemProps) {
  const label = getContactLabel(conversation);
  const { awaitingSince } = conversation;

  return (
    <NavLink
      to={`/mensajes/${conversation.id}`}
      className={({ isActive }) =>
        cx(
          'flex items-start gap-space-sm border-l-4 px-space-md py-space-md transition-colors',
          isActive
            ? 'border-primary-container bg-primary-fixed/40'
            : 'border-transparent hover:bg-surface-container-low',
        )
      }
    >
      <ContactAvatar conversation={conversation} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline justify-between gap-space-sm">
          <span className="truncate font-body-md text-body-md font-semibold text-on-surface">
            {label}
          </span>
          <time
            dateTime={conversation.lastMessageAt}
            className="shrink-0 font-label-sm text-label-sm text-on-surface-variant"
          >
            {formatListTime(conversation.lastMessageAt)}
          </time>
        </div>
        <span className="truncate font-body-sm text-body-sm text-on-surface-variant">
          {conversation.lastMessagePreview}
        </span>
        {awaitingSince ? (
          <span
            className={cx(
              'inline-flex w-fit items-center gap-1 rounded-md px-1.5 py-0.5 font-label-md text-label-md font-semibold',
              isLongWait(awaitingSince)
                ? 'bg-error-container text-on-error-container'
                : 'bg-tertiary-fixed/60 text-on-tertiary-fixed-variant',
            )}
          >
            <Icon name="timer" size={14} />
            Esperando {formatWaiting(awaitingSince)}
          </span>
        ) : (
          <span className="inline-flex w-fit items-center gap-1 rounded-md bg-secondary-fixed/30 px-1.5 py-0.5 font-label-md text-label-md text-on-secondary-fixed-variant">
            <Icon name="check" size={14} />
            Respondido
          </span>
        )}
      </div>
    </NavLink>
  );
}
