import type { Pool } from 'pg';
import type { BusinessRepository } from './businessRepository';
import type { Business, BusinessInput } from './types';

interface BusinessRow {
  name: string | null;
  region: string | null;
  address: string | null;
}

const EMPTY: Business = { name: null, region: null, address: null };

/** El negocio en PostgreSQL: una sola fila (id = 1), creada al guardar por primera vez. */
export class PostgresBusinessRepository implements BusinessRepository {
  constructor(private readonly pool: Pool) {}

  async get(): Promise<Business> {
    const { rows } = await this.pool.query<BusinessRow>(
      'SELECT name, region, address FROM business WHERE id = 1',
    );
    return rows[0] ?? EMPTY;
  }

  async save(input: BusinessInput): Promise<Business> {
    const { rows } = await this.pool.query<BusinessRow>(
      `INSERT INTO business (id, name, address) VALUES (1, $1, $2)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, updated_at = now()
       RETURNING name, region, address`,
      [input.name, input.address],
    );
    return rows[0] as BusinessRow;
  }
}
