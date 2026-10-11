import { httpProfileService } from './httpProfileService';
import type { ProfileData } from './types';

/**
 * PUNTO ÚNICO donde se guarda el perfil (persona + negocio). Ninguna pantalla ni componente
 * escribe cookies ni llama al servidor directamente: todo pasa por este contrato.
 *
 * Hoy lo implementa `httpProfileService` (servidor real). `mockProfileService` (cookie del
 * navegador) queda para trabajar sin servidor: basta cambiar el export de abajo.
 * Endpoint:
 *   save -> PUT /api/profile   { user: { name, role }, business: { name, address } }
 *           Devuelve los mismos datos ya guardados.
 *
 * La lectura sigue en AuthService.getSession (persona) y BusinessService.getProfile (negocio).
 */
export interface ProfileService {
  /** Guarda todo junto y devuelve los datos tal como quedaron guardados. */
  save(data: ProfileData): Promise<ProfileData>;
}

export const profileService: ProfileService = httpProfileService;
