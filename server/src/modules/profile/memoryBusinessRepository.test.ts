import { describeBusinessRepository } from './businessRepository.contract';
import { MemoryBusinessRepository } from './memoryBusinessRepository';

describeBusinessRepository('MemoryBusinessRepository', async () => new MemoryBusinessRepository());
