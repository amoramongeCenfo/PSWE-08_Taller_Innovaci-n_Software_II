import { useCallback } from 'react';
import { usePolling } from '../../hooks/usePolling';
import { useAppDispatch } from '../../store/hooks';
import { fetchConversations } from './conversationsSlice';

/** Carga las conversaciones al mostrar la pantalla y las mantiene al día. */
export function useConversationsPolling(intervalMs: number): void {
  const dispatch = useAppDispatch();
  const refresh = useCallback(() => void dispatch(fetchConversations()), [dispatch]);
  usePolling(refresh, intervalMs);
}
