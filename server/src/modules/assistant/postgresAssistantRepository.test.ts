import { randomBytes } from 'node:crypto';
import type { Pool } from 'pg';
import { afterAll, beforeAll, describe } from 'vitest';
import { runMigrations } from '../../db/migrate';
import { createPool } from '../../db/pool';
import { describeAssistantRepository } from './assistantRepository.contract';
import { PostgresAssistantRepository } from './postgresAssistantRepository';

/** Se omite sin TEST_DATABASE_URL. Usa un esquema temporal: no toca tus tablas. */
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('PostgreSQL (asistente)', () => {
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

  describeAssistantRepository('PostgresAssistantRepository', async () => {
    await pool.query('TRUNCATE assistant_settings');
    return new PostgresAssistantRepository(pool);
  });
});
