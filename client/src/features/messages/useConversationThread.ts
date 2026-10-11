import { useCallback, useEffect, useRef, useState } from 'react';
import { usePolling } from '../../hooks/usePolling';
import { getErrorMessage } from '../../lib/http';
import { messageService } from './messageService';
import type { LoadStatus, Message } from './types';

const REFRESH_INTERVAL_MS = 5_000;

function oldestFirst(a: Message, b: Message): number {
  return Date.parse(a.createdAt) - Date.parse(b.createdAt);
}

/**
 * Mensajes de una conversación: los carga, los mantiene al día y envía respuestas.
 * Úsalo con `key={conversationId}` en el componente para empezar limpio al cambiar de chat.
 */
export function useConversationThread(conversationId: string, onSent?: () => void) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    try {
      const list = await messageService.listMessages(conversationId);
      if (!isMounted.current) return;
      setMessages([...list].sort(oldestFirst));
      setStatus('ready');
    } catch {
      // Si ya había mensajes en pantalla, un fallo puntual no los borra.
      if (isMounted.current) setStatus((current) => (current === 'ready' ? current : 'error'));
    }
  }, [conversationId]);

  // Carga los mensajes al abrir la conversación y los mantiene al día.
  usePolling(() => void load(), REFRESH_INTERVAL_MS);

  const reload = useCallback(() => {
    setStatus('loading');
    void load();
  }, [load]);

  /** Envía una respuesta. Devuelve true si salió bien (para vaciar el cuadro de texto). */
  const send = useCallback(
    async (text: string): Promise<boolean> => {
      setIsSending(true);
      setSendError(null);
      try {
        const sent = await messageService.sendMessage(conversationId, text);
        if (!isMounted.current) return true;
        setMessages((current) =>
          current.some((message) => message.id === sent.id) ? current : [...current, sent],
        );
        onSent?.();
        return true;
      } catch (error) {
        if (isMounted.current) setSendError(getErrorMessage(error));
        return false;
      } finally {
        if (isMounted.current) setIsSending(false);
      }
    },
    [conversationId, onSent],
  );

  return { messages, status, isSending, sendError, reload, send };
}
