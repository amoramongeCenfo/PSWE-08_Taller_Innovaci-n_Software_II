import type { KnowledgeRepository } from './knowledgeRepository';
import { EMPTY_KNOWLEDGE, type BusinessKnowledge } from './types';

export class MemoryKnowledgeRepository implements KnowledgeRepository {
  private knowledge: BusinessKnowledge = structuredClone(EMPTY_KNOWLEDGE);

  async get() {
    return structuredClone(this.knowledge);
  }

  async save(knowledge: BusinessKnowledge) {
    this.knowledge = structuredClone(knowledge);
    return structuredClone(this.knowledge);
  }
}
