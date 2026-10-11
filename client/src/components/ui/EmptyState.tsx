import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { Icon } from '../Icon';

interface EmptyStateProps {
  icon: string;
  title: string;
  text: string;
  /** Acción opcional debajo del texto (un botón o enlace). */
  action?: ReactNode;
  className?: string;
}

/** Aviso para secciones sin datos: ícono, título, explicación y, si aplica, qué hacer. */
export function EmptyState({ icon, title, text, action, className }: EmptyStateProps) {
  return (
    <div
      className={cx(
        'flex flex-col items-center justify-center gap-space-sm rounded-2xl border border-dashed border-outline-variant p-space-lg text-center',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-low text-outline"
      >
        <Icon name={icon} size={24} />
      </span>
      <p className="font-headline-sm text-headline-sm text-on-surface">{title}</p>
      <p className="max-w-sm font-body-md text-body-md text-on-surface-variant">{text}</p>
      {action}
    </div>
  );
}
