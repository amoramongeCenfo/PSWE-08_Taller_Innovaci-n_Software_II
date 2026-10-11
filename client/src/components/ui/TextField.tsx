import { FormField } from './FormField';
import { Input, type InputProps } from './Input';

export interface TextFieldProps extends Omit<InputProps, 'invalid'> {
  label: string;
  hint?: string;
  error?: string;
}

/** Campo de texto completo: etiqueta, input y mensaje de ayuda o error. */
export function TextField({ label, hint, error, id, ...inputProps }: TextFieldProps) {
  return (
    <FormField label={label} hint={hint} error={error} id={id}>
      {(control) => (
        <Input
          {...inputProps}
          id={control.id}
          aria-describedby={control['aria-describedby']}
          invalid={control.invalid}
        />
      )}
    </FormField>
  );
}
