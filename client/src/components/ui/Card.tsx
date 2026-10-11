import type { ComponentPropsWithRef } from 'react';
import { cx } from '../../lib/cx';

export function Card({ className, ...rest }: ComponentPropsWithRef<'div'>) {
  return (
    <div
      className={cx(
        'rounded-2xl bg-surface-container-lowest p-space-lg shadow-card md:p-space-xl',
        className,
      )}
      {...rest}
    />
  );
}
