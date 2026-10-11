import { cx } from '../../lib/cx';
import type { AlertsTab } from './types';

const TABS: { value: AlertsTab; label: string }[] = [
  { value: 'nuevas', label: 'Nuevas' },
  { value: 'historial', label: 'Historial' },
];

interface AlertsTabsProps {
  active: AlertsTab;
  /** Cantidad en cada pestaña; null si todavía no se sabe. */
  counts: Record<AlertsTab, number | null>;
  onChange: (tab: AlertsTab) => void;
}

/** Pestañas: alertas por atender o ya atendidas. */
export function AlertsTabs({ active, counts, onChange }: AlertsTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Alertas"
      className="inline-flex rounded-xl bg-surface-container p-1"
    >
      {TABS.map((tab) => {
        const selected = tab.value === active;
        const count = counts[tab.value];
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.value)}
            className={cx(
              'inline-flex items-center gap-1.5 rounded-lg px-space-md py-1.5 font-label-md text-label-md',
              selected
                ? 'bg-surface-container-lowest font-semibold text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface',
            )}
          >
            {tab.label}
            {count !== null && (
              <span className="rounded-full bg-surface-container-high px-1.5 font-label-sm text-label-sm">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
