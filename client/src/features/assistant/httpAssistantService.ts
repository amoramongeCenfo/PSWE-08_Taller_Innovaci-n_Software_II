import { apiRequest } from '../../lib/http';
import type { AssistantService } from './assistantService';
import type { AssistantSettings } from './types';

export const httpAssistantService: AssistantService = {
  get: () => apiRequest<AssistantSettings>('/assistant'),
  save: (input, completeOnboarding) =>
    apiRequest<AssistantSettings>('/assistant', {
      method: 'PUT',
      body: JSON.stringify({ ...input, completeOnboarding }),
    }),
};
