import type { ComponentPropsWithRef } from 'react';
import { cx } from '../../lib/cx';
import { Icon } from '../Icon';

interface IconButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'children' | 'aria-label'> {
  /** Nombre del ícono de Material Symbols. */
  icon: string;
  /** Texto accesible. Es obligatorio porque el botón no tiene texto visible. */
  label: string;
}

/** Botón circular solo con ícono. Hereda el color del texto del contenedor. */
export function IconButton({ icon, label, type = 'button', className, ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cx(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-surface-container-high hover:text-on-surface disabled:opacity-60',
        className,
      )}
      {...rest}
    >
      <Icon name={icon} />
    </button>
  );
}
