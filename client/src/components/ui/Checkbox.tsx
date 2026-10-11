import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cx } from '../../lib/cx';

interface CheckboxProps extends Omit<ComponentPropsWithRef<'input'>, 'type'> {
  label: ReactNode;
  /** Texto secundario debajo de la etiqueta. */
  description?: string;
}

export function Checkbox({ label, description, className, ...rest }: CheckboxProps) {
  return (
    <label className={cx('flex cursor-pointer items-start gap-space-sm', className)}>
      <input
        type="checkbox"
        className="mt-px size-5 shrink-0 cursor-pointer rounded-sm accent-primary-container"
        {...rest}
      />
      <span className="flex flex-col">
        <span className="font-body-md text-body-md text-on-surface">{label}</span>
        {description && (
          <span className="font-body-sm text-body-sm text-on-surface-variant">{description}</span>
        )}
      </span>
    </label>
  );
}
