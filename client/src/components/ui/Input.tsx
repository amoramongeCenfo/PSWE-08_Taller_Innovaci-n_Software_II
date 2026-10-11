import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { Icon } from '../Icon';

export interface InputProps extends ComponentPropsWithRef<'input'> {
  /** Ícono de Material Symbols al inicio del campo. */
  startIcon?: string;
  /** Elemento al final del campo (por ejemplo, un IconButton). */
  endAdornment?: ReactNode;
  invalid?: boolean;
}

export function Input({
  startIcon,
  endAdornment,
  invalid = false,
  className,
  ...rest
}: InputProps) {
  return (
    <div className="relative flex items-center">
      {startIcon && (
        <Icon name={startIcon} className="pointer-events-none absolute left-3.5 text-outline" />
      )}
      <input
        aria-invalid={invalid || undefined}
        className={cx(
          'w-full rounded-xl bg-surface-container-low py-2.5 font-body-md text-body-md text-on-surface transition-all placeholder:text-outline focus:bg-surface-container-lowest focus:outline-none disabled:opacity-60',
          startIcon ? 'pl-11' : 'pl-4',
          endAdornment ? 'pr-12' : 'pr-4',
          invalid ? 'ring-2 ring-error' : 'focus:ring-2 focus:ring-primary-container',
          className,
        )}
        {...rest}
      />
      {endAdornment && <div className="absolute right-1.5 flex items-center">{endAdornment}</div>}
    </div>
  );
}
