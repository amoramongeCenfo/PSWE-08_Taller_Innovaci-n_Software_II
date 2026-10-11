import type { Pool } from 'pg';
import { migrations as allMigrations, type Migration } from './migrations';

/** Número fijo para que dos servidores que arrancan a la vez no apliquen las migraciones a la par. */
const LOCK_ID = 726_001;

/**
 * Aplica las migraciones que falten y devuelve los ids aplicados.
 * Cada migración corre en una transacción: o se aplica completa o no se aplica.
 */
export async function runMigrations(
  pool: Pool,
  migrations: readonly Migration[] = allMigrations,
): Promise<string[]> {
  const client = await pool.connect();
  const applied: string[] = [];
  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_ID]);
    await client.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         id text PRIMARY KEY,
         applied_at timestamptz NOT NULL DEFAULT now()
       )`,
    );
    const done = await client.query<{ id: string }>('SELECT id FROM schema_migrations');
    const doneIds = new Set(done.rows.map((row) => row.id));

    for (const migration of migrations) {
      if (doneIds.has(migration.id)) continue;
      try {
        await client.query('BEGIN');
        await client.query(migration.sql);
        await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [migration.id]);
        await client.query('COMMIT');
        applied.push(migration.id);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [LOCK_ID]).catch(() => undefined);
    client.release();
  }
  return applied;
}
