import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Icon } from '../../components/Icon';
import { Card } from '../../components/ui';
import { cx } from '../../lib/cx';
import { NOT_AVAILABLE } from '../../lib/format';

export interface StatCardAction {
  label: string;
  to: string;
  /** "critical" pinta la acción en rojo (por ejemplo, alertas). */
  tone?: 'primary' | 'critical';
}

interface StatCardProps {
  /** Categoría, por ejemplo "Flujo prioritario". */
  eyebrow: string;
  /** Etiqueta de estado (un Badge). Se omite si no hay nada que destacar. */
  badge?: ReactNode;
  /** Cifra principal. null o undefined muestran "N/A". */
  value: number | null | undefined;
  /** Unidad junto a la cifra, por ejemplo "mensajes". No se muestra si no hay cifra. */
  unit: string;
  title: string;
  description: string;
  /** Pie de la tarjeta: un enlace de acción o una nota corta. */
  action?: StatCardAction;
  note?: { icon: string; text: string };
}

/** Tarjeta de indicador del panel: categoría, cifra grande, título, explicación y acción. */
export function StatCard({
  eyebrow,
  badge,
  value,
  unit,
  title,
  description,
  action,
  note,
}: StatCardProps) {
  const hasValue = typeof value === 'number';

  return (
    <Card className="flex flex-col gap-space-sm p-space-lg md:p-space-lg">
      <div className="flex min-h-6 items-start justify-between gap-space-sm">
        <span className="font-label-md text-label-md font-medium uppercase tracking-wider text-on-surface-variant">
          {eyebrow}
        </span>
        {badge}
      </div>

      <p className="flex items-baseline gap-space-sm">
        <span className="font-display-lg text-display-lg text-on-surface">
          {hasValue ? value : NOT_AVAILABLE}
        </span>
        {hasValue && (
          <span className="font-body-md text-body-md text-on-surface-variant">{unit}</span>
        )}
      </p>

      <h2 className="font-headline-sm text-headline-sm text-on-surface">{title}</h2>
      <p className="flex-1 font-body-md text-body-md text-on-surface-variant">{description}</p>

      {(action || note) && (
        <div className="mt-space-xs border-t border-hairline pt-space-sm">
          {action ? (
            <Link
              to={action.to}
              className={cx(
                'flex items-center justify-between gap-space-sm font-body-md text-body-md font-semibold hover:underline',
                action.tone === 'critical' ? 'text-critical' : 'text-primary',
              )}
            >
              {action.label}
              <Icon name="chevron_right" size={20} />
            </Link>
          ) : (
            note && (
              <p className="flex items-center gap-space-xs font-body-md text-body-md text-on-surface-variant">
                <Icon name={note.icon} size={18} className="text-secondary" />
                {note.text}
              </p>
            )
          )}
        </div>
      )}
    </Card>
  );
}
