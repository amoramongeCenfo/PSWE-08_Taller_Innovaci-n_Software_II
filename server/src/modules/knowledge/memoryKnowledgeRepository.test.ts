import { describeKnowledgeRepository } from './knowledgeRepository.contract';
import { MemoryKnowledgeRepository } from './memoryKnowledgeRepository';

describeKnowledgeRepository(
  'MemoryKnowledgeRepository',
  async () => new MemoryKnowledgeRepository(),
);
