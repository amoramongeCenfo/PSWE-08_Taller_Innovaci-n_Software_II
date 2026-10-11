import { Avatar } from '../../components/ui';
import { getInitials } from '../../lib/format';
import type { AlertComment } from './types';

/** El comentario del cliente, tal como lo escribió. */
export function CommentQuote({ comment }: { comment: AlertComment }) {
  return (
    <figure className="flex flex-col gap-space-sm">
      <figcaption className="flex items-center gap-space-sm">
        <Avatar initials={getInitials(comment.author)} className="h-7 w-7" />
        <span className="font-body-md text-body-md font-semibold text-on-surface">
          {comment.author}
        </span>
        {(comment.handle || comment.detail) && (
          <span className="font-label-md text-label-md text-on-surface-variant">
            {comment.handle ?? comment.detail}
          </span>
        )}
      </figcaption>
      <blockquote className="rounded-xl bg-surface-container-low px-space-md py-space-sm font-body-md text-body-md text-on-surface">
        “{comment.text}”
      </blockquote>
    </figure>
  );
}
