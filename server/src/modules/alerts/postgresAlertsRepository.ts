import type { Pool } from 'pg';
import type { ChannelId } from '../conversations/types';
import type { AlertsRepository } from './alertsRepository';
import type { CommentRisk } from './commentAnalyzer';
import {
  DEFAULT_ALERT_SETTINGS,
  type AlertComment,
  type AlertSettings,
  type AlertStatus,
  type NewAlert,
  type ReputationAlert,
  type SuggestedReply,
} from './types';

/** Lo que se guarda en la columna jsonb `data`. */
interface AlertData {
  source: string;
  comment: AlertComment;
  thread: AlertComment[];
  suggestedReply: SuggestedReply | null;
  postUrl: string | null;
}

interface AlertRow {
  id: string;
  channel: ChannelId;
  risk: CommentRisk;
  status: AlertStatus;
  detected_at: Date;
  data: AlertData;
}

function toAlert(row: AlertRow): ReputationAlert {
  return {
    id: row.id,
    channel: row.channel,
    risk: row.risk,
    status: row.status,
    source: row.data.source,
    comment: row.data.comment,
    thread: row.data.thread ?? [],
    suggestedReply: row.data.suggestedReply ?? null,
    postUrl: row.data.postUrl ?? null,
    detectedAt: row.detected_at.toISOString(),
  };
}

/** Alertas en PostgreSQL. Cada alerta es una fila; su contenido anidado va en una columna jsonb. */
export class PostgresAlertsRepository implements AlertsRepository {
  constructor(private readonly pool: Pool) {}

  async list(status: AlertStatus): Promise<ReputationAlert[]> {
    const { rows } = await this.pool.query<AlertRow>(
      `SELECT id, channel, risk, status, detected_at, data
       FROM reputation_alerts WHERE status = $1 ORDER BY detected_at DESC`,
      [status],
    );
    return rows.map(toAlert);
  }

  async add(alert: NewAlert): Promise<ReputationAlert> {
    const data: AlertData = {
      source: alert.source,
      comment: alert.comment,
      thread: alert.thread ?? [],
      suggestedReply: alert.suggestedReply ?? null,
      postUrl: alert.postUrl ?? null,
    };
    const { rows } = await this.pool.query<AlertRow>(
      `INSERT INTO reputation_alerts (channel, risk, status, detected_at, data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, channel, risk, status, detected_at, data`,
      [
        alert.channel,
        alert.risk,
        alert.status ?? 'nueva',
        alert.detectedAt ?? new Date().toISOString(),
        JSON.stringify(data),
      ],
    );
    return toAlert(rows[0] as AlertRow);
  }

  async markAttended(id: string): Promise<void> {
    await this.pool.query(`UPDATE reputation_alerts SET status = 'atendida' WHERE id = $1`, [id]);
  }

  async getSettings(): Promise<AlertSettings> {
    const { rows } = await this.pool.query<{ data: Partial<AlertSettings> }>(
      'SELECT data FROM alert_settings WHERE id = 1',
    );
    return { ...DEFAULT_ALERT_SETTINGS, ...(rows[0]?.data ?? {}) };
  }

  async saveSettings(patch: Partial<AlertSettings>): Promise<AlertSettings> {
    const next = { ...(await this.getSettings()), ...patch };
    await this.pool.query(
      `INSERT INTO alert_settings (id, data) VALUES (1, $1)
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
      [JSON.stringify(next)],
    );
    return next;
  }

  async clear(): Promise<void> {
    await this.pool.query('DELETE FROM reputation_alerts');
  }
}
