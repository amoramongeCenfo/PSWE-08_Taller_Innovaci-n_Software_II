import type { ReactNode } from 'react';
import { Icon } from '../../components/Icon';
import { cx } from '../../lib/cx';
import { TOPICS } from '../assistant/topics';
import type { AutoTopic } from './types';

interface KnowledgeTopicSectionProps {
  topic: AutoTopic;
  description: string;
  /** Campos de la información. */
  children: ReactNode;
  /** Editor del mensaje que enviará Colibri. */
  template: ReactNode;
  /** Campos a todo el ancho y el mensaje debajo (para el horario, que necesita espacio). */
  stacked?: boolean;
}

/** Un tema: su información a la izquierda (o arriba) y el mensaje que enviará Colibri. */
export function KnowledgeTopicSection({
  topic,
  description,
  children,
  template,
  stacked = false,
}: KnowledgeTopicSectionProps) {
  const { title, icon } = TOPICS[topic];
  const headingId = `sabe-${topic}-titulo`;
  return (
    <section
      id={`sabe-${topic}`}
      aria-labelledby={headingId}
      className="flex scroll-mt-24 flex-col gap-space-md border-t border-hairline pt-space-lg first:border-t-0 first:pt-0"
    >
      <header className="flex items-start gap-space-md">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant"
        >
          <Icon name={icon} size={20} />
        </span>
        <div className="flex flex-col">
          <h3 id={headingId} className="font-headline-sm text-headline-sm text-on-surface">
            {title}
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant">{description}</p>
        </div>
      </header>
      <div
        className={cx(
          'grid grid-cols-1 gap-space-md',
          !stacked && 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]',
        )}
      >
        <div className="flex min-w-0 flex-col gap-space-md">{children}</div>
        <div className="min-w-0">{template}</div>
      </div>
    </section>
  );
}
