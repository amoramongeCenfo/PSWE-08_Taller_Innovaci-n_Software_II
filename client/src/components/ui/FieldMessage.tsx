import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';

interface FieldMessageProps {
  id: string;
  tone?: 'hint' | 'error';
  children: ReactNode;
}

/** Texto de ayuda o de error debajo de un campo. Se conecta al campo con aria-describedby. */
export function FieldMessage({ id, tone = 'hint', children }: FieldMessageProps) {
  return (
    <p
      id={id}
      className={cx(
        'pl-1 font-label-sm text-label-sm',
        tone === 'error' ? 'font-medium text-error' : 'text-on-surface-variant',
      )}
    >
      {children}
    </p>
  );
}
