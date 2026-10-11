import { writeProfileCookie } from './profileCookie';
import type { ProfileService } from './profileService';

const SIMULATED_LATENCY_MS = 400;

/** Servicio SIMULADO: guarda el perfil completo en una sola cookie (ver profileCookie.ts). */
export const mockProfileService: ProfileService = {
  async save(data) {
    await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));
    writeProfileCookie(data);
    return data;
  },
};
