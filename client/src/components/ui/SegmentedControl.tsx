import { useId } from 'react';
import { cx } from '../../lib/cx';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /** Texto de ayuda que se lee junto a la opción (tooltip y lectores de pantalla). */
  hint?: string;
}

interface SegmentedControlProps<T extends string> {
  /** Nombre accesible del grupo, por ejemplo "Horario de atención". */
  label: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Bloquea el control (por ejemplo, mientras la función no está disponible). */
  disabled?: boolean;
  className?: string;
}

/**
 * Elegir una opción entre pocas (2 a 4). Usa radios nativos: se recorre con las flechas del
 * teclado y los lectores de pantalla lo anuncian como un grupo de opciones.
 */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
  className,
}: SegmentedControlProps<T>) {
  const name = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled || undefined}
      className={cx(
        'inline-flex rounded-xl bg-surface-container p-1',
        disabled && 'opacity-60',
        className,
      )}
    >
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <label
            key={option.value}
            title={option.hint}
            className={cx(
              'relative flex items-center justify-center rounded-lg px-space-sm py-1.5 font-label-md text-label-md whitespace-nowrap transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary-container',
              disabled ? 'cursor-not-allowed' : 'cursor-pointer',
              checked
                ? 'bg-surface-container-lowest font-semibold text-on-surface shadow-sm'
                : 'text-on-surface-variant',
              !checked && !disabled && 'hover:text-on-surface',
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={checked}
              disabled={disabled}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
            {option.hint && <span className="sr-only">: {option.hint}</span>}
          </label>
        );
      })}
    </div>
  );
}
