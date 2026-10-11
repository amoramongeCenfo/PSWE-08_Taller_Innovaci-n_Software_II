import { apiRequest } from '../../lib/http';
import type { BusinessService } from './businessService';
import type { BusinessProfile } from './types';

/** Lee los datos del negocio desde el servidor (`GET /api/business`). */
export const httpBusinessService: BusinessService = {
  getProfile: () => apiRequest<BusinessProfile>('/business'),
};
