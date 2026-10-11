import { Icon } from '../../components/Icon';

interface KeywordListProps {
  keywords: string[];
  /** Sin manejadores, la lista es solo de lectura y "Agregar" se muestra bloqueado. */
  onAdd?: () => void;
  onRemove?: (keyword: string) => void;
}

/** Palabras que generan una alerta inmediata. */
export function KeywordList({ keywords, onAdd, onRemove }: KeywordListProps) {
  return (
    <section className="flex flex-col gap-space-sm">
      <div className="flex items-center justify-between gap-space-sm">
        <h3 className="font-label-md text-label-md font-semibold tracking-wide text-on-surface-variant uppercase">
          Palabras de alerta inmediata
        </h3>
        <span className="font-label-md text-label-md text-primary">
          {keywords.length} {keywords.length === 1 ? 'activa' : 'activas'}
        </span>
      </div>

      {keywords.length === 0 ? (
        <p className="rounded-xl bg-surface-container-low px-space-md py-space-sm font-body-sm text-body-sm text-on-surface-variant">
          Aún no hay palabras clave. Por ejemplo: estafa, intoxicación o mala atención.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-space-xs">
          {keywords.map((keyword) => (
            <li
              key={keyword}
              className="inline-flex items-center gap-1 rounded-full bg-error-container/60 py-0.5 pr-1 pl-2.5 font-label-md text-label-md text-on-error-container"
            >
              {keyword}
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(keyword)}
                  aria-label={`Quitar "${keyword}"`}
                  className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-error-container"
                >
                  <Icon name="close" size={12} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={onAdd}
        disabled={!onAdd}
        className="inline-flex w-fit items-center gap-1 font-label-md text-label-md font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:no-underline"
      >
        <Icon name="add" size={16} />
        Agregar palabra clave
      </button>
    </section>
  );
}
