import { Badge } from '../../components/ui';
import { useAppSelector } from '../../store/hooks';
import { comingSoonPath } from '../assistant';
import { selectPendingConversationCount, type ConversationStats } from '../messages';
import { StatCard } from './StatCard';

interface StatsOverviewProps {
  /** Indicadores de la última semana; null mientras cargan o si fallan (se muestra N/A). */
  stats: ConversationStats | null;
}

/**
 * Los cuatro indicadores del panel. "Mensajes pendientes" y "Respondidos solitos" tienen datos
 * reales; los demás muestran N/A hasta que existan la atención fuera de horario y las alertas.
 */
export function StatsOverview({ stats }: StatsOverviewProps) {
  const pending = useAppSelector(selectPendingConversationCount);
  const autoReplies = stats?.autoReplies ?? null;

  return (
    <section
      aria-label="Resumen de atención"
      className="grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-4"
    >
      <StatCard
        eyebrow="Flujo prioritario"
        badge={pending ? <Badge tone="warning">En espera</Badge> : undefined}
        value={pending}
        unit={pending === 1 ? 'conversación' : 'conversaciones'}
        title="Mensajes pendientes"
        description="Clientes que esperan tu respuesta o tu visto bueno."
        {...(pending === 0
          ? { note: { icon: 'check_circle', text: 'Todo al día' } }
          : { action: { label: 'Atender ahora', to: '/mensajes' } })}
      />
      <StatCard
        eyebrow="Respuestas listas"
        value={autoReplies}
        unit={autoReplies === 1 ? 'respuesta' : 'respuestas'}
        title="Respondidos solitos"
        description={`Consultas que Colibri contestó al instante en los últimos ${stats?.days ?? 7} días.`}
        {...(autoReplies
          ? { note: { icon: 'bolt', text: 'Con tus precios y horarios' } }
          : { action: { label: 'Completar información', to: '/mi-negocio#lo-que-sabe' } })}
      />
      <StatCard
        eyebrow="Nocturno / Feriado"
        value={null}
        unit="contactos"
        title="Atendidos fuera de horario"
        description="Personas que escribieron de noche o en feriado y recibieron respuesta."
        action={{ label: 'Muy pronto', to: comingSoonPath('Atención fuera de horario') }}
      />
      <StatCard
        eyebrow="Monitoreo"
        value={null}
        unit="incidentes"
        title="Alertas importantes"
        description="Comentarios delicados en tus redes para revisar con calma."
        action={{ label: 'Examinar detalles', to: '/alertas', tone: 'critical' }}
      />
    </section>
  );
}
