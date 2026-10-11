import { readProfileCookie } from '../profile/profileCookie';
import type { BusinessService } from './businessService';
import { EMPTY_BUSINESS_PROFILE } from './types';

/**
 * Servicio SIMULADO de datos del negocio. Muestra lo guardado desde la pantalla Perfil; mientras
 * no se guarde nada, todo viene vacío y la interfaz muestra "N/A".
 */
export const mockBusinessService: BusinessService = {
  async getProfile() {
    return { ...EMPTY_BUSINESS_PROFILE, ...readProfileCookie()?.business };
  },
};
