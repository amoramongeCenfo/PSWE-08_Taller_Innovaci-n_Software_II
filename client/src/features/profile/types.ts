/** Datos de la persona que se guardan desde la pantalla Perfil. */
export interface UserProfileData {
  name: string;
  role: string;
}

/** Datos del negocio que se guardan desde la pantalla Perfil. */
export interface BusinessProfileData {
  name: string;
  /** null si se deja vacía. */
  address: string | null;
}

/** Todo lo que se guarda desde la pantalla Perfil, en una sola operación. */
export interface ProfileData {
  user: UserProfileData;
  business: BusinessProfileData;
}
