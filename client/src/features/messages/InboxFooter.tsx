import { cx } from '../../lib/cx';

interface InboxFooterProps {
  shown: number;
  total: number;
  syncFailed: boolean;
}

/** Cuántas conversaciones se ven y si la bandeja está al día con el servidor. */
export function InboxFooter({ shown, total, syncFailed }: InboxFooterProps) {
  return (
    <footer className="flex items-center justify-between gap-space-sm border-t border-hairline px-space-md py-space-sm font-label-md text-label-md text-on-surface-variant">
      <span>
        {shown} de {total} {total === 1 ? 'conversación' : 'conversaciones'}
      </span>
      <span role="status" className="inline-flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className={cx('h-2 w-2 rounded-full', syncFailed ? 'bg-critical' : 'bg-secondary')}
        />
        <span className={syncFailed ? 'text-error' : 'text-secondary'}>
          {syncFailed ? 'Sin conexión, reintentando…' : 'Sincronizado'}
        </span>
      </span>
    </footer>
  );
}
