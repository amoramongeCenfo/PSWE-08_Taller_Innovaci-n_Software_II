import { randomBytes } from 'node:crypto';
import type { Pool } from 'pg';
import { afterAll, beforeAll, describe } from 'vitest';
import { runMigrations } from '../../db/migrate';
import { createPool } from '../../db/pool';
import { describeAlertsRepository } from './alertsRepository.contract';
import { PostgresAlertsRepository } from './postgresAlertsRepository';

/** Se omite sin TEST_DATABASE_URL. Usa un esquema temporal: no toca tus tablas. */
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('PostgreSQL (alertas de reputación)', () => {
  const schema = `test_${randomBytes(6).toString('hex')}`;
  let admin: Pool;
  let pool: Pool;

  beforeAll(async () => {
    admin = createPool(url as string);
    await admin.query(`CREATE SCHEMA ${schema}`);
    pool = createPool(url as string, schema);
    await runMigrations(pool);
  });

  afterAll(async () => {
    await pool.end();
    await admin.query(`DROP SCHEMA ${schema} CASCADE`);
    await admin.end();
  });

  describeAlertsRepository('PostgresAlertsRepository', async () => {
    await pool.query('TRUNCATE reputation_alerts');
    await pool.query('TRUNCATE alert_settings');
    return new PostgresAlertsRepository(pool);
  });
});
