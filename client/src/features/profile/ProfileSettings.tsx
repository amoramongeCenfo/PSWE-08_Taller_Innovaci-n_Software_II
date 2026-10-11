import { Alert, Button, Spinner } from '../../components/ui';
import { ProfileForm } from './ProfileForm';
import { useProfileSettings } from './useProfileSettings';

/** Carga los datos y muestra el formulario de perfil cuando están listos. */
export function ProfileSettings() {
  const { isLoading, hasError, initialValues, reload, save } = useProfileSettings();

  if (hasError) {
    return (
      <div className="flex max-w-2xl flex-col items-start gap-space-md">
        <Alert tone="error">No pudimos cargar tus datos.</Alert>
        <Button variant="secondary" onClick={reload}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div role="status" className="flex items-center gap-space-sm text-on-surface-variant">
        <Spinner />
        <span className="font-body-md text-body-md">Cargando tus datos…</span>
      </div>
    );
  }

  return <ProfileForm initialValues={initialValues} onSave={save} />;
}
