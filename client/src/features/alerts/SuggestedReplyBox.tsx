import { Icon } from '../../components/Icon';
import type { SuggestedReply } from './types';

/** Respuesta que Colibri preparó para el comentario. Siempre la aprueba una persona. */
export function SuggestedReplyBox({ reply }: { reply: SuggestedReply }) {
  return (
    <section className="flex flex-col gap-space-xs">
      <h3 className="flex items-center gap-space-xs font-label-md text-label-md font-semibold text-primary">
        <Icon name="auto_awesome" size={16} />
        {reply.title}
      </h3>
      <p className="rounded-xl border-l-4 border-primary-container bg-primary-fixed/25 px-space-md py-space-sm font-body-md text-body-md text-on-surface">
        “{reply.text}”
      </p>
    </section>
  );
}
