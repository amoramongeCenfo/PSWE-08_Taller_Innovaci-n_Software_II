import type { ComponentPropsWithRef } from 'react';
import { cx } from '../../lib/cx';

export interface TextAreaProps extends ComponentPropsWithRef<'textarea'> {
  invalid?: boolean;
}

/** Texto de varias líneas, con el mismo estilo que Input. */
export function TextArea({ invalid = false, className, rows = 3, ...rest }: TextAreaProps) {
  return (
    <textarea
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cx(
        'w-full resize-y rounded-xl bg-surface-container-low px-4 py-2.5 font-body-md text-body-md text-on-surface transition-all placeholder:text-outline focus:bg-surface-container-lowest focus:outline-none disabled:opacity-60',
        invalid ? 'ring-2 ring-error' : 'focus:ring-2 focus:ring-primary-container',
        className,
      )}
      {...rest}
    />
  );
}
