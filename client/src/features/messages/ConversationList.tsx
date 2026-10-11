import { ConversationItem } from './ConversationItem';
import type { Conversation } from './types';

interface ConversationListProps {
  conversations: readonly Conversation[];
}

export function ConversationList({ conversations }: ConversationListProps) {
  return (
    <ul aria-label="Conversaciones" className="flex flex-col divide-y divide-hairline">
      {conversations.map((conversation) => (
        <li key={conversation.id}>
          <ConversationItem conversation={conversation} />
        </li>
      ))}
    </ul>
  );
}
