import { Pool } from 'pg';

/** Pool de conexiones a PostgreSQL. `schema` solo se usa en pruebas, para aislar cada ejecución. */
export function createPool(connectionString: string, schema?: string): Pool {
  return new Pool({
    connectionString,
    max: 10,
    ...(schema ? { options: `-c search_path=${schema}` } : undefined),
  });
}
