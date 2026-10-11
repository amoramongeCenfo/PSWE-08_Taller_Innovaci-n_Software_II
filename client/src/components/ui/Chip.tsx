import { Icon } from '../Icon';

interface ChipProps {
  label: string;
  /** Nombre de un ícono de Material Symbols antes del texto. */
  icon?: string;
}

/** Etiqueta pequeña e informativa (no es un botón). */
export function Chip({ label, icon }: ChipProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-low px-3 py-1 font-label-md text-label-md text-on-surface-variant">
      {icon && <Icon name={icon} size={16} />}
      {label}
    </span>
  );
}
