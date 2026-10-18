import { apiRequest } from '../../lib/http';
import type { AlertsService } from './alertsService';
import type { AlertSettings, ReputationAlert } from './types';

/** Lee y gestiona alertas de reputación desde el servidor. */
export const httpAlertsService: AlertsService = {
  listNew: () => apiRequest<ReputationAlert[]>('/alerts'),
  listHistory: () => apiRequest<ReputationAlert[]>('/alerts/historial'),
  getSettings: () => apiRequest<AlertSettings>('/alerts/settings'),
  saveSettings: (patch) =>
    apiRequest<AlertSettings>('/alerts/settings', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
};
