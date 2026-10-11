import { Link } from 'react-router';
import { Icon } from '../../components/Icon';
import { Avatar, Badge } from '../../components/ui';
import { cx } from '../../lib/cx';
import { getInitials } from '../../lib/format';
import { ChannelLogo } from '../channels';
import {
  formatListTime,
  getChannelLabel,
  getContactLabel,
  isAwaitingReply,
  type Conversation,
} from '../messages';

interface ActivityItemProps {
  conversation: Conversation;
}

/** Una consulta reciente: quién, por qué canal, qué dijo y qué falta hacer. */
export function ActivityItem({ conversation }: ActivityItemProps) {
  const label = getContactLabel(conversation);
  const hasName = Boolean(conversation.contactName?.trim());
  const awaitingReply = isAwaitingReply(conversation);
  const href = `/mensajes/${conversation.id}`;

  return (
    <div
      className={cx(
        'relative flex items-center gap-space-md rounded-2xl p-space-md transition-colors',
        awaitingReply
          ? 'bg-primary-fixed/25 ring-1 ring-primary-fixed-dim'
          : 'bg-surface-container-lowest ring-1 ring-hairline hover:bg-surface-container-low',
      )}
    >
      <div className="relative shrink-0">
        <Avatar initials={hasName ? getInitials(label) : ''} className="h-11 w-11" />
        <span className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-surface-container-lowest ring-2 ring-surface-container-lowest">
          <ChannelLogo channel={conversation.channel} size={14} />
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-space-sm md:flex-row md:items-center md:justify-between md:gap-space-md">
        <div className="flex min-w-0 flex-col">
          <div className="flex items-baseline gap-space-sm">
            {/* El enlace cubre toda la fila; el botón de acción queda por encima. */}
            <Link
              to={href}
              className="truncate font-body-lg text-body-lg font-semibold text-on-surface after:absolute after:inset-0 after:rounded-2xl"
            >
              {label}
            </Link>
            <span className="shrink-0 font-label-md text-label-md text-on-surface-variant">
              {getChannelLabel(conversation.channel)}
            </span>
          </div>
          <span className="truncate font-body-md text-body-md text-on-surface-variant">
            “{conversation.lastMessagePreview}”
          </span>
        </div>

        <div className="relative shrink-0">
          {awaitingReply ? (
            <Link
              to={href}
              className="inline-flex h-9 items-center gap-space-xs rounded-xl bg-primary-container px-space-md font-label-md text-label-md font-semibold text-on-primary-container shadow-sm hover:opacity-95"
            >
              <Icon name="reply" size={18} />
              Responder
            </Link>
          ) : (
            <Badge tone="success" icon="check_circle">
              {`Respondido (${formatListTime(conversation.lastMessageAt)})`}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
