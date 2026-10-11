import { describeConversationRepository } from './conversationRepository.contract';
import { MemoryConversationRepository } from './memoryConversationRepository';

describeConversationRepository('MemoryConversationRepository', async () => {
  return new MemoryConversationRepository();
});
