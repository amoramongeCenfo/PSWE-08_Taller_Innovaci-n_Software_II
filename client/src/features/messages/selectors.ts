import type { RootState } from '../../store';
import { isAwaitingReply } from './conversationStatus';

/**
 * Conversaciones esperando respuesta: el último mensaje es de la persona, no nuestro.
 * Devuelve null mientras la lista no esté cargada, para mostrar "N/A" en lugar de un 0 falso.
 */
export function selectPendingConversationCount(state: RootState): number | null {
  const { status, items } = state.conversations;
  return status === 'ready' ? items.filter(isAwaitingReply).length : null;
}
