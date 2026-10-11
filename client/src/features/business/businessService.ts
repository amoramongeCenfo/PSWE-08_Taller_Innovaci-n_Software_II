import { httpBusinessService } from './httpBusinessService';
import type { BusinessProfile } from './types';

/**
 * Contrato para leer los datos del negocio. El resto de la aplicación solo conoce esta interfaz.
 * Nombre y dirección se guardan desde features/profile (ProfileService).
 *
 * Hoy lo implementa `httpBusinessService` (servidor real). `mockBusinessService` queda para
 * trabajar sin servidor: basta cambiar el export de abajo. Endpoint:
 *   getProfile -> GET /api/business   Devuelve BusinessProfile
 */
export interface BusinessService {
  getProfile(): Promise<BusinessProfile>;
}

export const businessService: BusinessService = httpBusinessService;
