import { describeAuthRepository } from './authRepository.contract';
import { MemoryAuthRepository } from './memoryAuthRepository';

describeAuthRepository('MemoryAuthRepository', async () => new MemoryAuthRepository());
