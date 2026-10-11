import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { formatClock } from '../messages/time';
import type { AlertComment } from './types';

/** Otros comentarios en la misma publicación, plegables. */
export function ThreadReplies({ replies }: { replies: AlertComment[] }) {
  const [isOpen, setIsOpen] = useState(true);
  if (replies.length === 0) return null;

  return (
    <div className="flex flex-col gap-space-sm">
      <div className="flex items-center justify-between gap-space-sm rounded-xl bg-tertiary-fixed/30 px-space-md py-space-xs">
        <span className="font-label-md text-label-md text-on-tertiary-fixed-variant">
          {replies.length} {replies.length === 1 ? 'comentario' : 'comentarios'} en la misma
          publicación
        </span>
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
          className="inline-flex items-center gap-1 font-label-md text-label-md font-semibold text-on-tertiary-fixed-variant hover:underline"
        >
          {isOpen ? 'Ocultar comentarios' : 'Ver comentarios'}
          <Icon name={isOpen ? 'expand_less' : 'expand_more'} size={16} />
        </button>
      </div>
      {isOpen && (
        <ul className="ml-space-lg flex flex-col gap-space-xs border-l-2 border-hairline pl-space-md">
          {replies.map((reply) => (
            <li key={`${reply.author}-${reply.postedAt}`} className="flex flex-col gap-0.5">
              <span className="font-label-md text-label-md text-on-surface-variant">
                <strong className="text-on-surface">{reply.author}</strong> ·{' '}
                {formatClock(reply.postedAt)}
              </span>
              <p className="font-body-sm text-body-sm text-on-surface">“{reply.text}”</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
