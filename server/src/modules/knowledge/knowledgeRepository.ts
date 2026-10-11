import type { BusinessKnowledge } from './types';

/** Información del negocio (una por instalación). Memoria y PostgreSQL pasan las mismas pruebas. */
export interface KnowledgeRepository {
  /** Siempre devuelve algo: todo vacío si nunca se guardó. */
  get(): Promise<BusinessKnowledge>;
  save(knowledge: BusinessKnowledge): Promise<BusinessKnowledge>;
}
