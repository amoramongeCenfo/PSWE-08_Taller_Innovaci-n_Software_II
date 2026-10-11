import { Icon } from '../../components/Icon';
import { Avatar } from '../../components/ui';
import { cx } from '../../lib/cx';
import { formatClock } from './time';
import type { Message, MessageStatus } from './types';

const STATUS_LABEL: Record<MessageStatus, string> = {
  received: 'Recibido',
  sent: 'Enviado',
  delivered: 'Entregado',
  read: 'Leído',
  failed: 'No se pudo enviar',
};

const STATUS_ICON: Record<MessageStatus, string> = {
  received: 'done',
  sent: 'done',
  delivered: 'done_all',
  read: 'done_all',
  failed: 'error',
};

interface MessageBubbleProps {
  message: Message;
  /** Iniciales de la persona, para el avatar junto a sus mensajes. */
  contactInitials: string;
}

/** Un mensaje: a la izquierda los de la persona (con su avatar), a la derecha los nuestros. */
export function MessageBubble({ message, contactInitials }: MessageBubbleProps) {
  const isOutbound = message.direction === 'outbound';
  const isUnsupported = message.type === 'unsupported' || message.text === null;

  return (
    <li className={cx('flex items-end gap-space-sm', isOutbound ? 'justify-end' : 'justify-start')}>
      {!isOutbound && <Avatar initials={contactInitials} className="mb-5 h-8 w-8" />}
      <div
        className={cx('flex max-w-[80%] flex-col gap-1', isOutbound ? 'items-end' : 'items-start')}
      >
        <p
          className={cx(
            'rounded-2xl px-space-md py-space-sm font-body-md text-body-md whitespace-pre-wrap break-words',
            isOutbound
              ? 'rounded-br-md bg-primary-container text-on-primary-container'
              : 'rounded-bl-md bg-surface-container-lowest text-on-surface shadow-sm ring-1 ring-hairline',
            isUnsupported && 'italic opacity-80',
          )}
        >
          {isUnsupported
            ? 'Este tipo de mensaje (foto, audio, etc.) aún no se puede mostrar.'
            : message.text}
        </p>
        <div className="flex items-center gap-1 px-1 font-label-sm text-label-sm text-on-surface-variant">
          {message.author === 'colibri' && (
            <>
              <span className="inline-flex items-center gap-0.5 font-semibold text-primary">
                <Icon name="bolt" size={14} />
                Respondido solito
              </span>
              <span aria-hidden="true">·</span>
            </>
          )}
          <time dateTime={message.createdAt}>{formatClock(message.createdAt)}</time>
          {isOutbound && (
            <>
              <span aria-hidden="true">·</span>
              <Icon
                name={STATUS_ICON[message.status]}
                size={14}
                className={message.status === 'failed' ? 'text-error' : 'text-primary'}
              />
              <span className={message.status === 'failed' ? 'text-error' : undefined}>
                {STATUS_LABEL[message.status]}
              </span>
            </>
          )}
        </div>
      </div>
    </li>
  );
}
