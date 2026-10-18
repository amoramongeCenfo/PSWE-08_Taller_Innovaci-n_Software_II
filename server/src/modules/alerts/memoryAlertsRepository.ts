import { randomUUID } from 'node:crypto';
import type { AlertsRepository } from './alertsRepository';
import {
  DEFAULT_ALERT_SETTINGS,
  type AlertSettings,
  type AlertStatus,
  type NewAlert,
  type ReputationAlert,
} from './types';

/**
 * Alertas en memoria: se pierden al reiniciar. Se usa cuando no hay DATABASE_URL.
 * Puede recibir un dataset inicial para que la pantalla muestre datos de ejemplo sin PostgreSQL.
 */
export class MemoryAlertsRepository implements AlertsRepository {
  private alerts: ReputationAlert[] = [];
  private settings: AlertSettings = structuredClone(DEFAULT_ALERT_SETTINGS);

  constructor(seed?: { alerts?: NewAlert[]; settings?: AlertSettings }) {
    for (const alert of seed?.alerts ?? []) this.insert(alert);
    if (seed?.settings) this.settings = structuredClone(seed.settings);
  }

  private insert(alert: NewAlert): ReputationAlert {
    const created: ReputationAlert = {
      id: randomUUID(),
      channel: alert.channel,
      source: alert.source,
      risk: alert.risk,
      status: alert.status ?? 'nueva',
      comment: alert.comment,
      thread: alert.thread ?? [],
      suggestedReply: alert.suggestedReply ?? null,
      postUrl: alert.postUrl ?? null,
      detectedAt: alert.detectedAt ?? new Date().toISOString(),
    };
    this.alerts.push(created);
    return created;
  }

  list(status: AlertStatus): Promise<ReputationAlert[]> {
    const result = this.alerts
      .filter((a) => a.status === status)
      .sort((a, b) => b.detectedAt.localeCompare(a.detectedAt))
      .map((a) => structuredClone(a));
    return Promise.resolve(result);
  }

  add(alert: NewAlert): Promise<ReputationAlert> {
    return Promise.resolve(structuredClone(this.insert(alert)));
  }

  markAttended(id: string): Promise<void> {
    const alert = this.alerts.find((a) => a.id === id);
    if (alert) alert.status = 'atendida';
    return Promise.resolve();
  }

  getSettings(): Promise<AlertSettings> {
    return Promise.resolve(structuredClone(this.settings));
  }

  saveSettings(patch: Partial<AlertSettings>): Promise<AlertSettings> {
    this.settings = { ...this.settings, ...patch };
    return Promise.resolve(structuredClone(this.settings));
  }

  clear(): Promise<void> {
    this.alerts = [];
    return Promise.resolve();
  }
}
