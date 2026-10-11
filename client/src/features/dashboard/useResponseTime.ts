import { useCallback, useState } from 'react';
import { usePolling } from '../../hooks/usePolling';
import { messageService, type ConversationStats } from '../messages';

const REFRESH_MS = 60_000;

/** Tiempo promedio de respuesta de la última semana. null mientras carga o si falla. */
export function useResponseTime(): ConversationStats | null {
  const [stats, setStats] = useState<ConversationStats | null>(null);
  const load = useCallback(() => {
    messageService
      .getStats()
      .then(setStats)
      .catch(() => setStats(null));
  }, []);
  usePolling(load, REFRESH_MS);
  return stats;
}
