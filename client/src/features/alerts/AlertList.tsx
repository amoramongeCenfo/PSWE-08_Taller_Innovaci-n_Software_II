import { EmptyState } from '../../components/ui';
import { AlertCard } from './AlertCard';
import type { AlertsTab, ReputationAlert } from './types';

const EMPTY: Record<AlertsTab, { title: string; text: string }> = {
  nuevas: {
    title: 'Sin alertas por ahora',
    text: 'Cuando Colibri detecte un comentario delicado en tus redes, aparecerá aquí con una respuesta sugerida.',
  },
  historial: {
    title: 'Aún no hay alertas atendidas',
    text: 'Las alertas que marques como atendidas se guardarán aquí.',
  },
};

interface AlertListProps {
  tab: AlertsTab;
  alerts: ReputationAlert[];
}

/** Lista de alertas de una pestaña, o un aviso si no hay ninguna. */
export function AlertList({ tab, alerts }: AlertListProps) {
  if (alerts.length === 0) {
    return <EmptyState icon="shield" className="py-16" {...EMPTY[tab]} />;
  }
  return (
    <ul className="flex flex-col gap-space-md">
      {alerts.map((alert) => (
        <li key={alert.id}>
          <AlertCard alert={alert} />
        </li>
      ))}
    </ul>
  );
}
