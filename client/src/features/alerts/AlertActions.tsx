import { Icon } from '../../components/Icon';
import { Button } from '../../components/ui';

interface AlertActionsProps {
  /** Sin manejador, el botón se muestra deshabilitado (la función aún no existe). */
  onReplyPublic?: () => void;
  onReplyPrivate?: () => void;
  onMarkAttended?: () => void;
  postUrl: string | null;
}

/** Qué hacer con la alerta: responder en público o por privado, ver el original o cerrarla. */
export function AlertActions({
  onReplyPublic,
  onReplyPrivate,
  onMarkAttended,
  postUrl,
}: AlertActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-space-sm border-t border-hairline pt-space-md">
      <Button startIcon="reply" onClick={onReplyPublic} disabled={!onReplyPublic}>
        Responder en público
      </Button>
      <Button variant="secondary" onClick={onReplyPrivate} disabled={!onReplyPrivate}>
        Escribir por privado
      </Button>
      <div className="ml-auto flex flex-wrap items-center gap-space-md">
        {postUrl && (
          <a
            href={postUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-label-md text-label-md text-on-surface-variant hover:underline"
          >
            Ver publicación original
            <Icon name="open_in_new" size={14} />
          </a>
        )}
        <button
          type="button"
          onClick={onMarkAttended}
          disabled={!onMarkAttended}
          className="inline-flex items-center gap-1 font-label-md text-label-md text-on-surface-variant hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Icon name="check" size={16} />
          Marcar como atendida
        </button>
      </div>
    </div>
  );
}
