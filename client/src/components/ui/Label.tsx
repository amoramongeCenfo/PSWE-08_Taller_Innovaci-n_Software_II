import type { ComponentPropsWithRef } from 'react';
import { cx } from '../../lib/cx';

export function Label({ className, ...rest }: ComponentPropsWithRef<'label'>) {
  return (
    <label
      className={cx('font-label-md text-label-md font-semibold text-on-surface', className)}
      {...rest}
    />
  );
}
