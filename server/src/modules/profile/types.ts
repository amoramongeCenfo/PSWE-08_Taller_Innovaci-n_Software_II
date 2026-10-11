/** Datos del negocio. Cada campo es null mientras no esté disponible (la interfaz muestra "N/A"). */
export interface Business {
  name: string | null;
  region: string | null;
  address: string | null;
}

/** Lo que se edita desde la pantalla Perfil. */
export interface BusinessInput {
  name: string;
  /** null si se deja vacía. */
  address: string | null;
}
