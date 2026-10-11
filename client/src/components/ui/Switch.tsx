import { cx } from '../../lib/cx';

interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  className?: string;
}

/** Interruptor de encendido/apagado con su etiqueta visible. */
export function Switch({ label, checked, onChange, disabled = false, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={cx(
        'inline-flex items-center gap-space-sm rounded-xl px-space-sm py-1.5 font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent',
        className,
      )}
    >
      <span className="leading-tight">{label}</span>
      <span
        aria-hidden="true"
        className={cx(
          'relative h-5 w-9 shrink-0 rounded-full transition-colors',
          checked ? 'bg-primary-container' : 'bg-outline-variant',
        )}
      >
        <span
          className={cx(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-4.5' : 'translate-x-0.5',
          )}
        />
      </span>
    </button>
  );
}
