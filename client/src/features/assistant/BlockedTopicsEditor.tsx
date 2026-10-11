import { useId, useState, type FormEvent } from 'react';
import { Icon } from '../../components/Icon';
import { Button, Input } from '../../components/ui';
import { ASSISTANT_LIMITS } from './types';

interface BlockedTopicsEditorProps {
  topics: string[];
  onChange: (topics: string[]) => void;
}

/** Temas que Colibri nunca debe contestar. Se agregan y quitan como etiquetas. */
export function BlockedTopicsEditor({ topics, onChange }: BlockedTopicsEditorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();
  const inputId = useId();
  const isFull = topics.length >= ASSISTANT_LIMITS.maxTopics;

  const add = (event: FormEvent) => {
    event.preventDefault();
    const topic = draft.trim();
    if (!topic) return setError('Escribe el tema.');
    if (topics.some((t) => t.toLowerCase() === topic.toLowerCase())) {
      return setError('Ese tema ya está en la lista.');
    }
    onChange([...topics, topic]);
    setDraft('');
    setError(null);
    setIsAdding(false);
  };

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-space-sm">
      <h3
        id={titleId}
        className="flex items-center gap-space-sm font-headline-sm text-headline-sm text-on-surface"
      >
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-critical" />
        Temas que Colibri nunca debe contestar
      </h3>
      <p className="font-body-md text-body-md text-on-surface-variant">
        Consultas delicadas o que necesitan tu atención directa. Cuando pregunten por esto, Colibri
        te avisa de inmediato.
      </p>

      <ul className="flex flex-wrap items-center gap-space-sm">
        {topics.map((topic) => (
          <li
            key={topic}
            className="inline-flex items-center gap-1 rounded-full bg-surface-container-low py-1 pr-1 pl-3 font-label-md text-label-md text-on-surface"
          >
            {topic}
            <button
              type="button"
              onClick={() => onChange(topics.filter((t) => t !== topic))}
              aria-label={`Quitar "${topic}"`}
              className="flex h-6 w-6 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            >
              <Icon name="close" size={14} />
            </button>
          </li>
        ))}
        {!isAdding && !isFull && (
          <li>
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-primary-container px-3 py-1 font-label-md text-label-md font-semibold text-primary hover:bg-primary-fixed/40"
            >
              <Icon name="add" size={16} />
              Agregar tema
            </button>
          </li>
        )}
      </ul>

      {topics.length === 0 && !isAdding && (
        <p className="font-label-md text-label-md text-on-surface-variant">
          Aún no hay temas. Por ejemplo: tratamientos médicos o descuentos por mayor.
        </p>
      )}

      {isAdding && (
        <form onSubmit={add} className="flex flex-col gap-space-xs sm:max-w-md">
          <label htmlFor={inputId} className="sr-only">
            Tema nuevo
          </label>
          <div className="flex gap-space-sm">
            <Input
              id={inputId}
              autoFocus
              value={draft}
              maxLength={ASSISTANT_LIMITS.topicLength}
              placeholder="Ej.: Descuentos por mayor"
              invalid={Boolean(error)}
              aria-describedby={error ? `${inputId}-error` : undefined}
              onChange={(event) => {
                setDraft(event.target.value);
                setError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setIsAdding(false);
              }}
            />
            <Button type="submit" variant="secondary">
              Agregar
            </Button>
            <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>
              Cancelar
            </Button>
          </div>
          {error && (
            <span id={`${inputId}-error`} className="font-label-md text-label-md text-error">
              {error}
            </span>
          )}
        </form>
      )}
    </section>
  );
}
