import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Alert, Button, Checkbox, PasswordField, TextField } from '../../components/ui';
import { getAuthErrorMessage } from './errors';
import { validateLogin, type LoginFieldErrors } from './validation';
import { useAuth } from './useAuth';

/**
 * Formulario de inicio de sesión. Solo arma átomos de components/ui y habla con useAuth().
 * Al iniciar sesión, la redirección la hace RedirectIfAuthenticated al cambiar el estado.
 */
export function LoginForm() {
  const { login } = useAuth();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [values, setValues] = useState({ email: '', password: '', rememberMe: false });
  const [errors, setErrors] = useState<LoginFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: 'email' | 'password') => (event: ChangeEvent<HTMLInputElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const fieldErrors = validateLogin(values);
    setErrors(fieldErrors);
    setFormError(null);

    if (fieldErrors.email) return emailRef.current?.focus();
    if (fieldErrors.password) return passwordRef.current?.focus();

    setIsSubmitting(true);
    try {
      await login(values);
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
      setIsSubmitting(false);
      passwordRef.current?.focus();
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-space-lg">
      {formError && <Alert tone="error">{formError}</Alert>}

      <TextField
        ref={emailRef}
        label="Correo electrónico"
        type="email"
        name="email"
        autoComplete="username"
        inputMode="email"
        placeholder="nombre@negocio.cr"
        startIcon="mail"
        value={values.email}
        onChange={handleChange('email')}
        error={errors.email}
        disabled={isSubmitting}
      />

      <PasswordField
        ref={passwordRef}
        label="Contraseña"
        name="password"
        autoComplete="current-password"
        placeholder="Tu contraseña"
        startIcon="lock"
        value={values.password}
        onChange={handleChange('password')}
        error={errors.password}
        disabled={isSubmitting}
      />

      <Checkbox
        name="rememberMe"
        label="Mantener sesión iniciada"
        description="Úsalo solo en tu computadora o celular personal."
        checked={values.rememberMe}
        onChange={(event) =>
          setValues((current) => ({ ...current, rememberMe: event.target.checked }))
        }
        disabled={isSubmitting}
      />

      <Button type="submit" fullWidth loading={isSubmitting}>
        {isSubmitting ? 'Entrando…' : 'Iniciar sesión'}
      </Button>
    </form>
  );
}
