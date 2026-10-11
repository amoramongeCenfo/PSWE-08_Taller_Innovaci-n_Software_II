import { Badge } from '../../components/ui';

interface InboxHeaderProps {
  /** Conversaciones que esperan respuesta; null mientras carga. */
  pending: number | null;
}

/** Título de la bandeja con el estado general: "Al día" o cuántos esperan. */
export function InboxHeader({ pending }: InboxHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-space-sm px-space-md pt-space-md pb-space-sm">
      <div className="flex min-w-0 flex-col">
        <h1 className="font-headline-md text-headline-md text-on-surface">Mensajes de clientes</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Tus redes en un solo lugar
        </p>
      </div>
      {pending !== null &&
        (pending === 0 ? (
          <Badge tone="success" icon="check_circle">
            Al día
          </Badge>
        ) : (
          <Badge tone="warning" icon="schedule">
            {`${pending} ${pending === 1 ? 'espera' : 'esperan'}`}
          </Badge>
        ))}
    </header>
  );
}
