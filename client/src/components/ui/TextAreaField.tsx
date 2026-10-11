import { FormField } from './FormField';
import { TextArea, type TextAreaProps } from './TextArea';

export interface TextAreaFieldProps extends Omit<TextAreaProps, 'invalid'> {
  label: string;
  hint?: string;
  error?: string;
}

/** Campo de varias líneas completo: etiqueta, texto y mensaje de ayuda o error. */
export function TextAreaField({ label, hint, error, id, ...props }: TextAreaFieldProps) {
  return (
    <FormField label={label} hint={hint} error={error} id={id}>
      {(control) => (
        <TextArea
          {...props}
          id={control.id}
          aria-describedby={control['aria-describedby']}
          invalid={control.invalid}
        />
      )}
    </FormField>
  );
}
