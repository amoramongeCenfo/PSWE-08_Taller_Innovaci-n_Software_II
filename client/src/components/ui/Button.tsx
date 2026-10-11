import type { ComponentPropsWithRef } from 'react';
import { cx } from '../../lib/cx';
import { Icon } from '../Icon';
import { Spinner } from './Spinner';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  /** Muestra un indicador de carga y bloquea el botón. */
  loading?: boolean;
  /** Nombre de un ícono de Material Symbols para mostrar antes del texto. */
  startIcon?: string;
}

const base =
  'inline-flex h-11 items-center justify-center gap-space-sm rounded-xl px-space-lg font-body-md text-body-md font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary-container text-on-primary-container shadow-sm hover:opacity-95',
  secondary:
    'bg-surface-container-lowest text-on-surface shadow-sm hover:bg-surface-container-high',
  ghost: 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
};

export function Button({
  variant = 'primary',
  fullWidth = false,
  loading = false,
  startIcon,
  type = 'button',
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(base, variants[variant], fullWidth && 'w-full', className)}
      {...rest}
    >
      {loading ? <Spinner /> : startIcon ? <Icon name={startIcon} size={18} /> : null}
      {children}
    </button>
  );
}
