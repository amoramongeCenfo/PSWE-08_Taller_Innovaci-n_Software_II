import { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { Alert, Button, Spinner } from '../../components/ui';
import { usePolling } from '../../hooks/usePolling';
import { cx } from '../../lib/cx';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { ConversationList } from './ConversationList';
import { fetchConversations } from './conversationsSlice';
import { InboxFooter } from './InboxFooter';
import { InboxHeader } from './InboxHeader';
import { applyInboxFilters, DEFAULT_FILTERS, type InboxFilters } from './inboxFilters';
import { InboxToolbar } from './InboxToolbar';
import { MessageThread } from './MessageThread';
import { PanelMessage } from './PanelMessage';
import { selectPendingConversationCount } from './selectors';

const REFRESH_INTERVAL_MS = 8_000;

/**
 * Bandeja unificada: lista de conversaciones a la izquierda y la conversación elegida a la derecha.
 * En pantallas pequeñas se muestra una a la vez (la lista, o la conversación con botón de volver).
 */
export function MessagesInbox() {
  const { conversationId } = useParams();
  const dispatch = useAppDispatch();
  const { status, items, syncFailed } = useAppSelector((state) => state.conversations);
  const pending = useAppSelector(selectPendingConversationCount);
  const [filters, setFilters] = useState<InboxFilters>(DEFAULT_FILTERS);

  const refresh = useCallback(() => void dispatch(fetchConversations()), [dispatch]);
  // Carga la lista al entrar y la mantiene al día.
  usePolling(refresh, REFRESH_INTERVAL_MS);

  const visible = useMemo(() => applyInboxFilters(items, filters), [items, filters]);
  const selected = items.find((conversation) => conversation.id === conversationId) ?? null;
  const isFiltering = filters.query.trim() !== '' || filters.channel !== 'all';

  return (
    <div className="grid h-[calc(100dvh-8rem)] min-h-112 grid-cols-1 overflow-hidden rounded-2xl bg-surface-container-lowest shadow-card lg:grid-cols-[24rem_minmax(0,1fr)]">
      <section
        aria-label="Lista de conversaciones"
        className={cx(
          'min-h-0 min-w-0 flex-col border-hairline lg:flex lg:border-r',
          conversationId ? 'hidden' : 'flex',
        )}
      >
        <InboxHeader pending={pending} />
        <InboxToolbar filters={filters} onChange={setFilters} />

        <div className="min-h-0 flex-1 overflow-y-auto border-t border-hairline">
          {status === 'loading' && (
            <div
              role="status"
              className="flex items-center gap-space-sm p-space-lg text-on-surface-variant"
            >
              <Spinner />
              <span className="font-body-md text-body-md">Cargando conversaciones…</span>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-start gap-space-md p-space-md">
              <Alert tone="error">No pudimos cargar tus conversaciones.</Alert>
              <Button variant="secondary" onClick={refresh}>
                Reintentar
              </Button>
            </div>
          )}

          {status === 'ready' && items.length === 0 && (
            <PanelMessage
              icon="inbox"
              title="Aún no tienes conversaciones"
              text="Cuando alguien te escriba por WhatsApp, Instagram o Messenger, su mensaje aparecerá aquí."
            />
          )}

          {status === 'ready' && items.length > 0 && visible.length === 0 && (
            <div className="flex flex-col items-center gap-space-sm p-space-lg text-center">
              <p className="font-body-md text-body-md text-on-surface-variant">
                Ninguna conversación coincide con tu búsqueda.
              </p>
              {isFiltering && (
                <Button variant="ghost" onClick={() => setFilters(DEFAULT_FILTERS)}>
                  Quitar filtros
                </Button>
              )}
            </div>
          )}

          {visible.length > 0 && <ConversationList conversations={visible} />}
        </div>

        {status === 'ready' && (
          <InboxFooter shown={visible.length} total={items.length} syncFailed={syncFailed} />
        )}
      </section>

      <section
        aria-label="Conversación"
        className={cx('min-h-0 min-w-0 flex-col lg:flex', conversationId ? 'flex' : 'hidden')}
      >
        {!conversationId && (
          <PanelMessage
            icon="forum"
            title="Elige una conversación"
            text="Selecciona un chat de la lista para leer y responder."
          />
        )}

        {conversationId && selected && <MessageThread key={selected.id} conversation={selected} />}

        {conversationId && !selected && status === 'ready' && (
          <PanelMessage
            icon="search_off"
            title="No encontramos esa conversación"
            text="Puede que se haya eliminado. Elige otra de la lista."
          />
        )}
      </section>
    </div>
  );
}
