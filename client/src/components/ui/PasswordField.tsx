import { useState } from 'react';
import { IconButton } from './IconButton';
import { TextField, type TextFieldProps } from './TextField';

type PasswordFieldProps = Omit<TextFieldProps, 'type' | 'endAdornment'>;

/** Campo de contraseña con botón para mostrarla u ocultarla. */
export function PasswordField(props: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={isVisible ? 'text' : 'password'}
      endAdornment={
        <IconButton
          icon={isVisible ? 'visibility_off' : 'visibility'}
          label={isVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={isVisible}
          onClick={() => setIsVisible((visible) => !visible)}
          className="text-on-surface-variant"
        />
      }
    />
  );
}
