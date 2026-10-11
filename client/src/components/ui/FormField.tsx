import { useId, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { FieldMessage } from './FieldMessage';
import { Label } from './Label';

/** Propiedades que el control (input, select, etc.) debe recibir para quedar bien conectado. */
export interface FieldControlProps {
  id: string;
  'aria-describedby': string | undefined;
  invalid: boolean;
}

interface FormFieldProps {
  label: string;
  hint?: string;
  error?: string;
  id?: string;
  className?: string;
  /** Recibe las propiedades de accesibilidad para pasárselas al control. */
  children: (control: FieldControlProps) => ReactNode;
}

/** Etiqueta + control + mensaje, con los ids de accesibilidad ya conectados. */
export function FormField({ label, hint, error, id, className, children }: FormFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const messageId = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;

  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <Label htmlFor={fieldId}>{label}</Label>
      {children({ id: fieldId, 'aria-describedby': messageId, invalid: Boolean(error) })}
      {error ? (
        <FieldMessage id={`${fieldId}-error`} tone="error">
          {error}
        </FieldMessage>
      ) : hint ? (
        <FieldMessage id={`${fieldId}-hint`}>{hint}</FieldMessage>
      ) : null}
    </div>
  );
}
