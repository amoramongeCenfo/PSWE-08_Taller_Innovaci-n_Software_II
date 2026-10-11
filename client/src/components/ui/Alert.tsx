import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { Icon } from '../Icon';

type AlertTone = 'error' | 'info' | 'success';

interface AlertProps {
  tone?: AlertTone;
  children: ReactNode;
  className?: string;
}

const tones: Record<AlertTone, { icon: string; classes: string }> = {
  error: { icon: 'error', classes: 'bg-error-container text-on-error-container' },
  info: { icon: 'info', classes: 'bg-primary-fixed text-on-primary-fixed-variant' },
  success: { icon: 'check_circle', classes: 'bg-secondary-fixed/30 text-secondary' },
};

/** Mensaje destacado. Los errores se anuncian de inmediato a lectores de pantalla. */
export function Alert({ tone = 'info', children, className }: AlertProps) {
  const { icon, classes } = tones[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cx(
        'flex items-start gap-space-sm rounded-xl px-space-md py-space-sm font-body-sm text-body-sm',
        classes,
        className,
      )}
    >
      <Icon name={icon} size={18} className="mt-px" />
      <div>{children}</div>
    </div>
  );
}
