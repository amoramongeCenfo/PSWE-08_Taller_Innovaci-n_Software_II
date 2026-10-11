import { NOT_AVAILABLE } from '../../lib/format';

const SIZE = 80;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface ScoreRingProps {
  /** Puntaje de 0 a `max`. null muestra "N/A" y el anillo vacío. */
  value: number | null;
  max?: number;
}

/** Anillo con un puntaje al centro. Decorativo: el significado va en el texto de al lado. */
export function ScoreRing({ value, max = 5 }: ScoreRingProps) {
  const ratio = value === null ? 0 : Math.min(Math.max(value / max, 0), 1);

  return (
    <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }} aria-hidden="true">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-surface-container-high"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - ratio)}
          className="stroke-primary-container"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-headline-md text-headline-md text-on-surface">
        {value === null ? (
          <span className="text-body-md text-outline">{NOT_AVAILABLE}</span>
        ) : (
          value
        )}
      </span>
    </div>
  );
}
