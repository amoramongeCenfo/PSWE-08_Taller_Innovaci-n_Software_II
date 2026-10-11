import { describeAssistantRepository } from './assistantRepository.contract';
import { MemoryAssistantRepository } from './memoryAssistantRepository';

describeAssistantRepository(
  'MemoryAssistantRepository',
  async () => new MemoryAssistantRepository(),
);
