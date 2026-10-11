export interface ProfileValues {
  businessName: string;
  /** Opcional. */
  address: string;
  userName: string;
  userRole: string;
}

export type ProfileFieldErrors = Partial<Record<keyof ProfileValues, string>>;

export const PROFILE_LIMITS = {
  businessName: 80,
  address: 200,
  userName: 80,
  userRole: 60,
} as const;

/** Valida el formulario de perfil. La dirección es opcional; el resto es obligatorio. */
export function validateProfile(values: ProfileValues): ProfileFieldErrors {
  const errors: ProfileFieldErrors = {};

  const required = (field: keyof ProfileValues, emptyMessage: string) => {
    const text = values[field].trim();
    if (!text) errors[field] = emptyMessage;
    else if (text.length > PROFILE_LIMITS[field]) {
      errors[field] = `Usa máximo ${PROFILE_LIMITS[field]} caracteres.`;
    }
  };

  required('businessName', 'Escribe el nombre de tu negocio.');
  required('userName', 'Escribe tu nombre.');
  required('userRole', 'Escribe tu puesto, por ejemplo: Gerente.');

  if (values.address.trim().length > PROFILE_LIMITS.address) {
    errors.address = `Usa máximo ${PROFILE_LIMITS.address} caracteres.`;
  }

  return errors;
}

/** Quita espacios sobrantes de todos los campos. */
export function normalizeProfile(values: ProfileValues): ProfileValues {
  return {
    businessName: values.businessName.trim(),
    address: values.address.trim(),
    userName: values.userName.trim(),
    userRole: values.userRole.trim(),
  };
}

export function isSameProfile(a: ProfileValues, b: ProfileValues): boolean {
  const x = normalizeProfile(a);
  const y = normalizeProfile(b);
  return (
    x.businessName === y.businessName &&
    x.address === y.address &&
    x.userName === y.userName &&
    x.userRole === y.userRole
  );
}
