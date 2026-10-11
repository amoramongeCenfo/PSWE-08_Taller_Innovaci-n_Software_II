/**
 * Datos del negocio de la persona usuaria.
 * Cada campo es null mientras no esté disponible; la interfaz muestra "N/A".
 */
export interface BusinessProfile {
  name: string | null;
  region: string | null;
  /** Dirección del negocio. Es opcional. */
  address: string | null;
}

export type BusinessStatus = 'idle' | 'loading' | 'ready' | 'error';

export const EMPTY_BUSINESS_PROFILE: BusinessProfile = {
  name: null,
  region: null,
  address: null,
};
