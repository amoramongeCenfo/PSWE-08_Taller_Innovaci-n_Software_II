import type { Pool } from 'pg';
import type { AssistantRepository } from './assistantRepository';
import {
  DEFAULT_SETTINGS,
  withDefaultRules,
  type AssistantSettings,
  type AssistantSettingsInput,
  type Tone,
  type Treatment,
} from './types';

interface SettingsRow {
  rules: Record<string, unknown>;
  blocked_topics: string[];
  tone: Tone;
  treatment: Treatment;
  signature: string | null;
  auto_reply_paused: boolean;
  onboarding_completed_at: Date | null;
}

const toSettings = (row: SettingsRow): AssistantSettings => ({
  rules: withDefaultRules(row.rules),
  blockedTopics: row.blocked_topics,
  tone: row.tone,
  treatment: row.treatment,
  signature: row.signature,
  autoReplyPaused: row.auto_reply_paused,
  onboardingCompletedAt: row.onboarding_completed_at?.toISOString() ?? null,
});

const COLUMNS =
  'rules, blocked_topics, tone, treatment, signature, auto_reply_paused, onboarding_completed_at';

/** Ajustes del asistente en PostgreSQL: una sola fila (id = 1), creada al guardar por primera vez. */
export class PostgresAssistantRepository implements AssistantRepository {
  constructor(private readonly pool: Pool) {}

  async get(): Promise<AssistantSettings> {
    const { rows } = await this.pool.query<SettingsRow>(
      `SELECT ${COLUMNS} FROM assistant_settings WHERE id = 1`,
    );
    return rows[0] ? toSettings(rows[0]) : structuredClone(DEFAULT_SETTINGS);
  }

  async save(input: AssistantSettingsInput, completedAt: string | null) {
    const { rows } = await this.pool.query<SettingsRow>(
      `INSERT INTO assistant_settings (id, rules, blocked_topics, tone, treatment, signature, auto_reply_paused, onboarding_completed_at)
       VALUES (1, $1, $2, $3, $4, $5, $7, $6)
       ON CONFLICT (id) DO UPDATE SET
         rules = EXCLUDED.rules,
         blocked_topics = EXCLUDED.blocked_topics,
         tone = EXCLUDED.tone,
         treatment = EXCLUDED.treatment,
         signature = EXCLUDED.signature,
         auto_reply_paused = EXCLUDED.auto_reply_paused,
         onboarding_completed_at = COALESCE(assistant_settings.onboarding_completed_at, EXCLUDED.onboarding_completed_at),
         updated_at = now()
       RETURNING ${COLUMNS}`,
      [
        JSON.stringify(input.rules),
        JSON.stringify(input.blockedTopics),
        input.tone,
        input.treatment,
        input.signature,
        completedAt,
        input.autoReplyPaused,
      ],
    );
    return toSettings(rows[0] as SettingsRow);
  }

  async resetOnboarding() {
    await this.pool.query(
      'UPDATE assistant_settings SET onboarding_completed_at = NULL, updated_at = now()',
    );
  }

  async clear() {
    await this.pool.query('DELETE FROM assistant_settings');
  }
}
