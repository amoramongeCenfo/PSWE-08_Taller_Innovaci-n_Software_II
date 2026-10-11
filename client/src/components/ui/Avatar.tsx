import { cx } from '../../lib/cx';
import { Icon } from '../Icon';

interface AvatarProps {
  /** Iniciales a mostrar. Si está vacío, se muestra un ícono de persona. */
  initials?: string;
  className?: string;
}

/** Círculo decorativo con iniciales. El nombre de la persona va siempre en texto a su lado. */
export function Avatar({ initials, className }: AvatarProps) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed font-label-md text-label-md font-semibold text-on-primary-fixed-variant',
        className,
      )}
    >
      {initials || <Icon name="person" size={20} />}
    </div>
  );
}
