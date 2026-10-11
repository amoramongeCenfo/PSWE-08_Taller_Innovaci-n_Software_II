import { cx } from '../../lib/cx';
import { Icon } from '../Icon';

type BadgeTone = 'info' | 'success' | 'neutral' | 'critical' | 'warning';

interface BadgeProps {
  tone?: BadgeTone;
  /** Ícono de Material Symbols antes del texto. */
  icon?: string;
  children: string;
}

const tones: Record<BadgeTone, string> = {
  info: 'text-primary',
  success: 'bg-secondary-container text-on-secondary-container',
  neutral: 'bg-surface-container-high text-on-surface-variant',
  critical: 'bg-error-container text-on-error-container',
  warning: 'bg-tertiary-fixed/60 text-on-tertiary-fixed-variant',
};

/** Etiqueta de estado corta, por ejemplo "En espera" o "Revisar". */
export function Badge({ tone = 'neutral', icon, children }: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full font-label-md text-label-md font-semibold whitespace-nowrap',
        tone !== 'info' && 'px-2.5 py-0.5',
        tones[tone],
      )}
    >
      {icon && <Icon name={icon} size={14} />}
      {children}
    </span>
  );
}
