import { Icon } from '../../components/Icon';
import { cx } from '../../lib/cx';
import type { RiskLevel } from './types';

export const RISK_STYLES: Record<
  RiskLevel,
  { label: string; icon: string; badge: string; border: string }
> = {
  alto: {
    label: 'Riesgo alto',
    icon: 'warning',
    badge: 'bg-error-container text-on-error-container',
    border: 'border-l-critical',
  },
  medio: {
    label: 'Riesgo medio',
    icon: 'error',
    badge: 'bg-tertiary-fixed/60 text-on-tertiary-fixed-variant',
    border: 'border-l-warning',
  },
  bajo: {
    label: 'Riesgo bajo',
    icon: 'info',
    badge: 'bg-surface-container-high text-on-surface-variant',
    border: 'border-l-outline-variant',
  },
};

/** Etiqueta del nivel de riesgo de un comentario. */
export function RiskBadge({ level }: { level: RiskLevel }) {
  const style = RISK_STYLES[level];
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 font-label-md text-label-md font-semibold whitespace-nowrap',
        style.badge,
      )}
    >
      <Icon name={style.icon} size={14} />
      {style.label}
    </span>
  );
}
