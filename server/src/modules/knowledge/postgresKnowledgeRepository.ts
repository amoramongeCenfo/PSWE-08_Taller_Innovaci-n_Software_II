import type { Pool } from 'pg';
import type { KnowledgeRepository } from './knowledgeRepository';
import { EMPTY_KNOWLEDGE, type BusinessKnowledge } from './types';

/** Une lo guardado con la forma vacía: si en el futuro se agregan campos, nunca faltan. */
function withDefaults(data: Partial<BusinessKnowledge>): BusinessKnowledge {
  const base = structuredClone(EMPTY_KNOWLEDGE);
  return {
    ...base,
    ...data,
    hours: {
      ...base.hours,
      ...data.hours,
      days: { ...base.hours.days, ...data.hours?.days },
    },
    location: { ...base.location, ...data.location },
    payments: { ...base.payments, ...data.payments },
    templates: { ...data.templates },
  };
}

/** Información del negocio en PostgreSQL: una sola fila (id = 1) con un documento JSON. */
export class PostgresKnowledgeRepository implements KnowledgeRepository {
  constructor(private readonly pool: Pool) {}

  async get(): Promise<BusinessKnowledge> {
    const { rows } = await this.pool.query<{ data: Partial<BusinessKnowledge> }>(
      'SELECT data FROM business_knowledge WHERE id = 1',
    );
    return withDefaults(rows[0]?.data ?? {});
  }

  async save(knowledge: BusinessKnowledge): Promise<BusinessKnowledge> {
    const { rows } = await this.pool.query<{ data: Partial<BusinessKnowledge> }>(
      `INSERT INTO business_knowledge (id, data) VALUES (1, $1)
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
       RETURNING data`,
      [JSON.stringify(knowledge)],
    );
    return withDefaults(rows[0]?.data ?? {});
  }
}
