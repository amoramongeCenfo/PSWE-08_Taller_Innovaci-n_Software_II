import { httpAssistantService } from './httpAssistantService';
import type { AssistantSettings, AssistantSettingsInput } from './types';

/**
 * Contrato para leer y guardar cómo atiende Colibri. Endpoints:
 *   get  -> GET /api/assistant
 *   save -> PUT /api/assistant   (completeOnboarding: true al terminar la bienvenida)
 */
export interface AssistantService {
  get(): Promise<AssistantSettings>;
  save(input: AssistantSettingsInput, completeOnboarding: boolean): Promise<AssistantSettings>;
}

export const assistantService: AssistantService = httpAssistantService;
