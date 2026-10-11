import { useCallback, useEffect, useRef } from 'react';
import { Alert, Button, Spinner } from '../../components/ui';
import { useAppDispatch } from '../../store/hooks';
import { getInitials } from '../../lib/format';
import { getContactLabel } from './contact';
import { getChannelLabel, getMaxReplyLength } from './conversationStatus';
import { fetchConversations } from './conversationsSlice';
import { MessageBubble } from './MessageBubble';
import { ReplyBox } from './ReplyBox';
import { ThreadHeader } from './ThreadHeader';
import { formatDayLabel, daysBetween, isReplyWindowOpen } from './time';
import type { Conversation, Message } from './types';
import { useConversationThread } from './useConversationThread';

interface MessageThreadProps {
  conversation: Conversation;
}

/** Separador con el día cuando cambia de un mensaje al siguiente. */
function startsNewDay(message: Message, previous: Message | undefined): boolean {
  return !previous || daysBetween(new Date(previous.createdAt), new Date(message.createdAt)) !== 0;
}

/** Conversación abierta: cabecera, mensajes y cuadro de respuesta. Usar con key={conversation.id}. */
export function MessageThread({ conversation }: MessageThreadProps) {
  const dispatch = useAppDispatch();
  const refreshList = useCallback(() => void dispatch(fetchConversations()), [dispatch]);
  const { messages, status, isSending, sendError, reload, send } = useConversationThread(
    conversation.id,
    refreshList,
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageId = messages.at(-1)?.id;
  const canReply = isReplyWindowOpen(conversation.lastInboundAt);
  const contactLabel = getContactLabel(conversation);
  const contactInitials = conversation.contactName?.trim() ? getInitials(contactLabel) : '';

  // Al llegar un mensaje nuevo, la conversación baja hasta el final.
  useEffect(() => {
    const container = scrollRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [lastMessageId]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ThreadHeader conversation={conversation} />

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto bg-surface-container-low/60 px-space-md py-space-md"
      >
        {status === 'loading' && (
          <div role="status" className="flex items-center gap-space-sm text-on-surface-variant">
            <Spinner />
            <span className="font-body-md text-body-md">Cargando mensajes…</span>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-start gap-space-md">
            <Alert tone="error">No pudimos cargar los mensajes.</Alert>
            <Button variant="secondary" onClick={reload}>
              Reintentar
            </Button>
          </div>
        )}

        {status === 'ready' && (
          <ul aria-label="Mensajes" className="flex flex-col gap-space-md">
            {messages.map((message, index) => (
              <div key={message.id} className="contents">
                {startsNewDay(message, messages[index - 1]) && (
                  <li aria-hidden="true" className="flex justify-center py-space-xs">
                    <span className="rounded-full bg-surface-container-high px-3 py-1 font-label-md text-label-md text-on-surface-variant">
                      {formatDayLabel(message.createdAt)}
                    </span>
                  </li>
                )}
                <MessageBubble message={message} contactInitials={contactInitials} />
              </div>
            ))}
          </ul>
        )}
      </div>

      {canReply ? (
        <ReplyBox
          contactLabel={contactLabel}
          maxLength={getMaxReplyLength(conversation.channel)}
          isSending={isSending}
          error={sendError}
          onSend={send}
        />
      ) : (
        <div className="border-t border-hairline p-space-md">
          <Alert tone="info">
            Pasaron más de 24 horas desde el último mensaje de esta persona.{' '}
            {getChannelLabel(conversation.channel)} solo permite responder cuando ella escribe de
            nuevo.
          </Alert>
        </div>
      )}
    </div>
  );
}
