import { randomBytes } from 'node:crypto';
import type { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runMigrations } from '../../db/migrate';
import { createPool } from '../../db/pool';
import { describeConversationRepository } from './conversationRepository.contract';
import { PostgresConversationRepository } from './postgresConversationRepository';

/**
 * Estas pruebas necesitan una base PostgreSQL. Si no defines TEST_DATABASE_URL se omiten.
 * Cada ejecución crea su propio esquema temporal y lo borra al terminar, así que es seguro
 * apuntarla a cualquier base (no toca tus tablas).
 *   Ejemplo: TEST_DATABASE_URL=postgresql://postgres:clave@localhost:5432/colibri
 */
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('PostgreSQL', () => {
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

  describeConversationRepository('PostgresConversationRepository', async () => {
    await pool.query('TRUNCATE messages, conversations CASCADE');
    return new PostgresConversationRepository(pool);
  });

  it('las migraciones son repetibles: la segunda vez no aplican nada', async () => {
    expect(await runMigrations(pool)).toEqual([]);
  });
});
