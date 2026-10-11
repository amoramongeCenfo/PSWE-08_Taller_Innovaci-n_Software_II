import { Link } from 'react-router';
import { Icon } from '../../components/Icon';
import { Alert, Card, Spinner } from '../../components/ui';
import { useAppSelector } from '../../store/hooks';
import { ActivityItem } from './ActivityItem';

const MAX_ITEMS = 5;

/** Las últimas conversaciones de todos los canales, con su estado. */
export function RecentActivity() {
  const { status, items } = useAppSelector((state) => state.conversations);
  const recent = items.slice(0, MAX_ITEMS);

  return (
    <Card className="flex flex-col gap-space-md p-space-lg md:p-space-lg xl:col-span-2">
      <div className="flex items-start justify-between gap-space-md">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">
            Mensajes y consultas recientes
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Lo último que te escribieron en tus redes
          </p>
        </div>
        <Link
          to="/mensajes"
          className="inline-flex shrink-0 items-center gap-1 font-body-md text-body-md font-semibold text-primary hover:underline"
        >
          Ver todos
          <Icon name="arrow_forward" size={18} />
        </Link>
      </div>

      {status === 'loading' && (
        <div role="status" className="flex items-center gap-space-sm text-on-surface-variant">
          <Spinner />
          <span className="font-body-md text-body-md">Cargando actividad…</span>
        </div>
      )}

      {status === 'error' && <Alert tone="error">No pudimos cargar la actividad reciente.</Alert>}

      {status === 'ready' && recent.length === 0 && (
        <p className="py-space-lg text-center font-body-md text-body-md text-on-surface-variant">
          Aún no hay actividad. Cuando alguien te escriba, lo verás aquí.
        </p>
      )}

      {recent.length > 0 && (
        <ul aria-label="Consultas recientes" className="flex flex-col gap-space-sm">
          {recent.map((conversation) => (
            <li key={conversation.id}>
              <ActivityItem conversation={conversation} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
