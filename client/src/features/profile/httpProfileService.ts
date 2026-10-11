import { apiRequest } from '../../lib/http';
import type { ProfileService } from './profileService';
import type { ProfileData } from './types';

/** Lo que responde `PUT /api/profile`: la persona y el negocio tal como quedaron guardados. */
interface SavedProfileResponse {
  user: { name: string | null; role: string | null };
  business: { name: string | null; address: string | null };
}

/** Guarda el perfil en el servidor (persona y negocio en una sola petición). */
export const httpProfileService: ProfileService = {
  async save(data) {
    const saved = await apiRequest<SavedProfileResponse>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const result: ProfileData = {
      user: { name: saved.user.name ?? data.user.name, role: saved.user.role ?? data.user.role },
      business: {
        name: saved.business.name ?? data.business.name,
        address: saved.business.address,
      },
    };
    return result;
  },
};
