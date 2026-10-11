import { Icon } from '../../components/Icon';
import { cx } from '../../lib/cx';
import { ONBOARDING_STEPS } from './steps';

interface OnboardingStepperProps {
  current: number;
  /** Paso más avanzado al que ya se llegó: se puede volver a cualquiera de los anteriores. */
  reached: number;
  onSelect: (step: number) => void;
}

/** Indicador de los tres pasos. Los ya visitados se pueden abrir de nuevo. */
export function OnboardingStepper({ current, reached, onSelect }: OnboardingStepperProps) {
  return (
    <nav aria-label="Pasos de la bienvenida">
      <ol className="grid gap-space-sm rounded-2xl bg-surface-container-lowest p-space-sm shadow-card sm:grid-cols-3">
        {ONBOARDING_STEPS.map((step, index) => {
          const isCurrent = index === current;
          const isDone = index < reached && !isCurrent;
          const canOpen = index <= reached;
          return (
            <li key={step.title}>
              <button
                type="button"
                disabled={!canOpen}
                aria-current={isCurrent ? 'step' : undefined}
                onClick={() => onSelect(index)}
                className={cx(
                  'flex w-full items-center gap-space-sm rounded-xl px-space-md py-space-sm text-left transition-colors',
                  isCurrent && 'bg-primary-fixed/50 ring-2 ring-primary-container',
                  isDone && 'bg-secondary-fixed/25 hover:bg-secondary-fixed/40',
                  !isCurrent && !isDone && 'bg-surface-container-low',
                  !canOpen && 'cursor-not-allowed',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cx(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-label-md text-label-md font-semibold',
                    isDone && 'bg-secondary text-on-secondary',
                    isCurrent && 'bg-primary-container text-on-primary-container',
                    !isCurrent && !isDone && 'bg-surface-container-high text-on-surface-variant',
                  )}
                >
                  {isDone ? <Icon name="check" size={16} /> : index + 1}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span
                    className={cx(
                      'font-label-md text-label-md',
                      isCurrent ? 'font-semibold text-primary' : 'text-on-surface',
                    )}
                  >
                    {step.title}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {isCurrent ? 'Paso actual' : isDone ? 'Listo' : 'Pendiente'}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
