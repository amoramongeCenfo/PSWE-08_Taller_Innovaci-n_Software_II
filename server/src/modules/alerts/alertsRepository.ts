import type { AlertSettings, AlertStatus, NewAlert, ReputationAlert } from './types';

/**
 * Contrato de almacenamiento de alertas de reputación. El resto del servidor solo conoce esta
 * interfaz. La implementan `MemoryAlertsRepository` (se pierde al reiniciar) y
 * `PostgresAlertsRepository` (persistente). Se elige en index.ts según haya DATABASE_URL.
 */
export interface AlertsRepository {
  /** Alertas con ese estado, la más reciente primero. */
  list(status: AlertStatus): Promise<ReputationAlert[]>;
  /** Guarda una alerta nueva y devuelve el registro completo. */
  add(alert: NewAlert): Promise<ReputationAlert>;
  /** Marca una alerta como atendida (pasa de "nueva" a "atendida"). */
  markAttended(id: string): Promise<void>;
  /** Configuración de sensibilidad y palabras clave (una sola por instalación). */
  getSettings(): Promise<AlertSettings>;
  /** Actualiza parcialmente la configuración y devuelve la versión guardada. */
  saveSettings(patch: Partial<AlertSettings>): Promise<AlertSettings>;
  /** Borra todas las alertas. Lo usa el script de carga de datos antes de inyectar el dataset. */
  clear(): Promise<void>;
}
