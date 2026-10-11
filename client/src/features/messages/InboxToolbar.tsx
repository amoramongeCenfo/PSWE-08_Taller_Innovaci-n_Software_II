import { useId } from 'react';
import { Icon } from '../../components/Icon';
import { cx } from '../../lib/cx';
import { ChannelLogo } from '../channels';
import type { InboxChannelFilter, InboxFilters, InboxSort } from './inboxFilters';

const CHANNEL_FILTERS: { value: InboxChannelFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'messenger', label: 'Messenger' },
];

const SORTS: { value: InboxSort; label: string }[] = [
  { value: 'recent', label: 'Más recientes' },
  { value: 'waiting', label: 'Más tiempo esperando' },
];

interface InboxToolbarProps {
  filters: InboxFilters;
  onChange: (filters: InboxFilters) => void;
}

/** Buscar, ordenar y filtrar por canal. */
export function InboxToolbar({ filters, onChange }: InboxToolbarProps) {
  const searchId = useId();
  const sortId = useId();
  const set = (patch: Partial<InboxFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="flex flex-col gap-space-sm px-space-md pb-space-sm">
      <div className="relative">
        <label htmlFor={searchId} className="sr-only">
          Buscar por cliente o mensaje
        </label>
        <Icon
          name="search"
          size={20}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-outline"
        />
        <input
          id={searchId}
          type="search"
          value={filters.query}
          onChange={(event) => set({ query: event.target.value })}
          placeholder="Buscar por cliente o mensaje…"
          className="h-10 w-full rounded-xl bg-surface-container-low pr-space-md pl-10 font-body-md text-body-md text-on-surface placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-between gap-space-sm rounded-xl bg-surface-container-low px-space-sm py-1">
        <label htmlFor={sortId} className="font-label-md text-label-md text-on-surface-variant">
          Ordenar por:
        </label>
        <select
          id={sortId}
          value={filters.sort}
          onChange={(event) => set({ sort: event.target.value as InboxSort })}
          className="cursor-pointer rounded-lg bg-transparent py-1 pr-1 text-right font-label-md text-label-md font-semibold text-primary focus:ring-2 focus:ring-primary-container focus:outline-none"
        >
          {SORTS.map((sort) => (
            <option key={sort.value} value={sort.value}>
              {sort.label}
            </option>
          ))}
        </select>
      </div>

      <div role="group" aria-label="Filtrar por canal" className="flex flex-wrap gap-space-xs">
        {CHANNEL_FILTERS.map((option) => {
          const active = filters.channel === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              title={option.label}
              onClick={() => set({ channel: option.value })}
              className={cx(
                'inline-flex h-8 items-center gap-1.5 rounded-full px-3 font-label-md text-label-md font-semibold transition-colors',
                active
                  ? 'bg-inverse-surface text-inverse-on-surface'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high',
              )}
            >
              {option.value === 'all' ? (
                option.label
              ) : (
                <>
                  <ChannelLogo channel={option.value} size={16} />
                  <span className="sr-only">{option.label}</span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
