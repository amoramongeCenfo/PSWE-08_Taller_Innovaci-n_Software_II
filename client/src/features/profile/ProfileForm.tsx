import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Alert, Button, Card, FormSection, TextField } from '../../components/ui';
import {
  isSameProfile,
  normalizeProfile,
  validateProfile,
  type ProfileFieldErrors,
  type ProfileValues,
} from './validation';

interface ProfileFormProps {
  initialValues: ProfileValues;
  /** Guarda los datos. Debe lanzar un error si no se pudo guardar. */
  onSave: (values: ProfileValues) => Promise<void>;
}

const FIELD_ORDER: readonly (keyof ProfileValues)[] = [
  'businessName',
  'address',
  'userName',
  'userRole',
];

type Feedback = 'saved' | 'failed' | null;

/** Formulario de perfil: arma átomos de components/ui y no sabe cómo ni dónde se guardan los datos. */
export function ProfileForm({ initialValues, onSave }: ProfileFormProps) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<ProfileFieldErrors>({});
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = !isSameProfile(values, initialValues);

  const handleChange = (field: keyof ProfileValues) => (event: ChangeEvent<HTMLInputElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFeedback(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    const fieldErrors = validateProfile(values);
    setErrors(fieldErrors);
    setFeedback(null);

    const firstInvalid = FIELD_ORDER.find((field) => fieldErrors[field]);
    if (firstInvalid) {
      const control = event.currentTarget.elements.namedItem(firstInvalid);
      if (control instanceof HTMLElement) control.focus();
      return;
    }

    setIsSaving(true);
    try {
      await onSave(values);
      setValues(normalizeProfile(values));
      setFeedback('saved');
    } catch {
      setFeedback('failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-space-lg">
      {feedback === 'saved' && <Alert tone="success">Listo, guardamos tus datos.</Alert>}
      {feedback === 'failed' && (
        <Alert tone="error">No pudimos guardar tus datos. Inténtalo de nuevo.</Alert>
      )}

      <Card className="flex flex-col gap-space-xl">
        <FormSection title="Tu negocio" description="Así aparece tu negocio en la aplicación.">
          <TextField
            label="Nombre del negocio"
            name="businessName"
            autoComplete="organization"
            placeholder="Ej. Café & Artesanías"
            startIcon="storefront"
            value={values.businessName}
            onChange={handleChange('businessName')}
            error={errors.businessName}
            disabled={isSaving}
          />
          <TextField
            label="Dirección (opcional)"
            name="address"
            autoComplete="street-address"
            placeholder="Ej. 200 m norte de la Basílica de los Ángeles, Cartago"
            startIcon="location_on"
            value={values.address}
            onChange={handleChange('address')}
            error={errors.address}
            disabled={isSaving}
          />
        </FormSection>

        <FormSection title="Tus datos" description="Quién usa esta cuenta.">
          <TextField
            label="Tu nombre"
            name="userName"
            autoComplete="name"
            placeholder="Ej. Ingrid Jiménez Forrester"
            startIcon="person"
            value={values.userName}
            onChange={handleChange('userName')}
            error={errors.userName}
            disabled={isSaving}
          />
          <TextField
            label="Puesto"
            name="userRole"
            autoComplete="organization-title"
            placeholder="Ej. Gerente"
            startIcon="badge"
            value={values.userRole}
            onChange={handleChange('userRole')}
            error={errors.userRole}
            disabled={isSaving}
          />
        </FormSection>
      </Card>

      <div>
        <Button type="submit" loading={isSaving} disabled={!hasChanges} startIcon="check">
          {isSaving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}
