import { Card } from '../../components/ui';
import { cx } from '../../lib/cx';
import { NOT_AVAILABLE } from '../../lib/format';
import type { ConversationStats } from '../messages';
import {
  formatResponseTime,
  getResponseBarRatio,
  getResponseSpeed,
  type ResponseSpeed,
} from './responseTime';
import { ScoreRing } from './ScoreRing';

const BAR_COLOR: Record<ResponseSpeed, string> = {
  rapida: 'bg-secondary',
  aceptable: 'bg-warning',
  lenta: 'bg-critical',
};

interface ReputationCardProps {
  /** Tiempo de respuesta real (GET /api/conversations/stats); null mientras carga. */
  stats: ConversationStats | null;
}

/**
 * Opinión de tus clientes. El puntaje necesita el análisis de comentarios (etapa de alertas),
 * así que por ahora es N/A. El tiempo promedio de respuesta sí es real.
 */
export function ReputationCard({ stats }: ReputationCardProps) {
  const average = stats?.responseTime.averageSeconds ?? null;
  const speed = average === null ? null : getResponseSpeed(average);

  return (
    <Card className="flex flex-col gap-space-md p-space-lg md:p-space-lg">
      <div className="flex items-center justify-between">
        <h2 className="font-headline-sm text-headline-sm text-on-surface">
          Opinión de tus clientes
        </h2>
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-outline-variant" />
      </div>

      <div className="flex items-center gap-space-md">
        <ScoreRing value={null} />
        <div className="flex min-w-0 flex-col">
          <p className="font-body-lg text-body-lg font-semibold text-on-surface">
            Sin datos todavía
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Cuando Colibri analice los comentarios de tus clientes, verás aquí su opinión.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-space-xs">
        <div className="flex items-center justify-between gap-space-sm font-body-md text-body-md">
          <span className="text-on-surface-variant">Tiempo promedio de respuesta</span>
          <span className="font-semibold whitespace-nowrap text-on-surface">
            {average === null ? NOT_AVAILABLE : formatResponseTime(average)}
          </span>
        </div>
        <div
          aria-hidden="true"
          className="h-1.5 overflow-hidden rounded-full bg-surface-container-high"
        >
          {average !== null && speed && (
            <div
              className={cx('h-full rounded-full transition-[width]', BAR_COLOR[speed])}
              style={{ width: `${getResponseBarRatio(average) * 100}%` }}
            />
          )}
        </div>
        <p className="font-label-md text-label-md text-on-surface-variant">
          {stats && average !== null
            ? `Últimos ${stats.days} días · ${stats.responseTime.samples} ${
                stats.responseTime.samples === 1 ? 'respuesta' : 'respuestas'
              }`
            : 'Se calcula con tus respuestas de la última semana.'}
        </p>
      </div>
    </Card>
  );
}
