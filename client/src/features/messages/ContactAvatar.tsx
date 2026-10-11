import { Avatar } from '../../components/ui';
import { cx } from '../../lib/cx';
import { getInitials } from '../../lib/format';
import { ChannelLogo } from '../channels';
import { getContactLabel } from './contact';
import type { Conversation } from './types';

interface ContactAvatarProps {
  conversation: Pick<Conversation, 'contactName' | 'contactId' | 'channel'>;
  className?: string;
}

/** Iniciales de la persona con el logo de su canal en la esquina. */
export function ContactAvatar({ conversation, className }: ContactAvatarProps) {
  const hasName = Boolean(conversation.contactName?.trim());
  return (
    <div className="relative shrink-0">
      <Avatar
        initials={hasName ? getInitials(getContactLabel(conversation)) : ''}
        className={cx('h-11 w-11', className)}
      />
      <span className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-surface-container-lowest ring-2 ring-surface-container-lowest">
        <ChannelLogo channel={conversation.channel} size={14} />
      </span>
    </div>
  );
}
