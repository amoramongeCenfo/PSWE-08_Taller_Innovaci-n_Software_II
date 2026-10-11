import { SegmentedControl } from '../../components/ui';
import type { Sensitivity } from './types';

const OPTIONS: { value: Sensitivity; label: string; hint: string }[] = [
  { value: 'grave', label: 'Solo lo grave', hint: 'Insultos, amenazas y denuncias públicas.' },
  {
    value: 'normal',
    label: 'Normal',
    hint: 'Reclamos de servicio, quejas de producto y palabras delicadas.',
  },
  { value: 'todo', label: 'Todo', hint: 'Cualquier comentario negativo, aunque sea leve.' },
];

interface SensitivityControlProps {
  value: Sensitivity;
  onChange?: (value: Sensitivity) => void;
}

/** Qué tan estricto es Colibri al analizar comentarios. Sin `onChange`, se muestra bloqueado. */
export function SensitivityControl({ value, onChange }: SensitivityControlProps) {
  const current = OPTIONS.find((option) => option.value === value);
  return (
    <section className="flex flex-col gap-space-sm">
      <h3 className="font-label-md text-label-md font-semibold tracking-wide text-on-surface-variant uppercase">
        Nivel de sensibilidad
      </h3>
      <SegmentedControl
        label="Nivel de sensibilidad"
        options={OPTIONS}
        value={value}
        onChange={(next) => onChange?.(next)}
        disabled={!onChange}
        className="w-full [&>label]:flex-1"
      />
      {current && (
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          <strong className="text-on-surface">{current.label}</strong>: {current.hint}
        </p>
      )}
    </section>
  );
}
