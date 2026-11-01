import { httpAlertsService } from './httpAlertsService';
import type { AlertSettings, ReputationAlert } from './types';

/**
 * Contrato del servicio de alertas. El resto de la aplicación solo conoce esta interfaz.
 *
 * Hoy lo implementa `httpAlertsService` (servidor real). `mockAlertsService` queda disponible
 * para trabajar sin servidor: basta cambiar el export de abajo.
 *
 * Endpoints:
 *   listNew      -> GET  /api/alerts             Alertas activas
 *   listHistory  -> GET  /api/alerts/historial   Alertas atendidas
 *   getSettings  -> GET  /api/alerts/settings    Configuración actual
 *   saveSettings -> PATCH /api/alerts/settings   Actualiza sensibilidad y palabras clave
 */
export interface AlertsService {
  listNew(): Promise<ReputationAlert[]>;
  listHistory(): Promise<ReputationAlert[]>;
  getSettings(): Promise<AlertSettings>;
  saveSettings(patch: Partial<AlertSettings>): Promise<AlertSettings>;
}

export const alertsService: AlertsService = httpAlertsService;
