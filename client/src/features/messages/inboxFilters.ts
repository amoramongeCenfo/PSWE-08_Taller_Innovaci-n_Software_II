import { getContactLabel } from './contact';
import type { ChannelId, Conversation } from './types';

export type InboxSort = 'recent' | 'waiting';
export type InboxChannelFilter = 'all' | ChannelId;

export interface InboxFilters {
  query: string;
  channel: InboxChannelFilter;
  sort: InboxSort;
}

export const DEFAULT_FILTERS: InboxFilters = { query: '', channel: 'all', sort: 'recent' };

/** Minúsculas y sin tildes, para que "sofia" encuentre "Sofía". */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function matches(conversation: Conversation, query: string): boolean {
  const haystack = [
    getContactLabel(conversation),
    conversation.contactId,
    conversation.lastMessagePreview,
  ]
    .map(normalize)
    .join(' ');
  return haystack.includes(query);
}

/**
 * Aplica búsqueda, canal y orden. "Más tiempo esperando" pone primero a quien espera desde
 * hace más; después, el resto por actividad reciente.
 */
export function applyInboxFilters(
  items: readonly Conversation[],
  { query, channel, sort }: InboxFilters,
): Conversation[] {
  const q = normalize(query.trim());
  const filtered = items.filter(
    (c) => (channel === 'all' || c.channel === channel) && (!q || matches(c, q)),
  );
  if (sort === 'recent') return filtered;
  return [...filtered].sort((a, b) => {
    if (a.awaitingSince && b.awaitingSince) {
      return Date.parse(a.awaitingSince) - Date.parse(b.awaitingSince);
    }
    if (a.awaitingSince) return -1;
    if (b.awaitingSince) return 1;
    return Date.parse(b.lastMessageAt) - Date.parse(a.lastMessageAt);
  });
}
