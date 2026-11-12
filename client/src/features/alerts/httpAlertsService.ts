import { apiRequest } from '../../lib/http';
import type { AlertsService } from './alertsService';
import type { AlertSettings, ReputationAlert } from './types';

/** Lee y gestiona alertas de reputación desde el servidor. */
export const httpAlertsService: AlertsService = {
  listNew: () => apiRequest<ReputationAlert[]>('/alerts'),
  listHistory: () => apiRequest<ReputationAlert[]>('/alerts/historial'),
  markAttended: async (id) => {
    await apiRequest<{ ok: boolean }>(`/alerts/${encodeURIComponent(id)}/atender`, {
      method: 'POST',
    });
  },
  getSettings: () => apiRequest<AlertSettings>('/alerts/settings'),
  saveSettings: (patch) =>
    apiRequest<AlertSettings>('/alerts/settings', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
};
