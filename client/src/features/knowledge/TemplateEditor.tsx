import { useId, useRef, useState } from 'react';
import { Icon } from '../../components/Icon';
import { Badge, Button, TextArea } from '../../components/ui';
import { cx } from '../../lib/cx';
import { KNOWLEDGE_LIMITS, type BusinessKnowledge, type TopicStatus } from './types';
import { useTemplatePreview } from './useTemplatePreview';

interface TemplateEditorProps {
  /** Nombre del tema, para los textos accesibles. */
  title: string;
  status: TopicStatus;
  /** Plantilla personalizada del borrador; null usa la de fábrica. */
  custom: string | null;
  knowledge: BusinessKnowledge;
  onChange: (template: string | null) => void;
}

/**
 * "Mensaje que enviará Colibri": vista previa con la información actual y, al editar, la
 * plantilla con botones para insertar datos y la opción de volver a la original.
 */
export function TemplateEditor({
  title,
  status,
  custom,
  knowledge,
  onChange,
}: TemplateEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const headingId = useId();
  const template = custom ?? status.defaultTemplate;
  const isCustom = custom !== null;
  const { preview, failed } = useTemplatePreview(template, knowledge, status.preview);

  const change = (value: string) => onChange(value === status.defaultTemplate ? null : value);

  /** Inserta `{variable}` donde está el cursor. */
  const insert = (name: string) => {
    const element = textareaRef.current;
    const token = `{${name}}`;
    const start = element?.selectionStart ?? template.length;
    const end = element?.selectionEnd ?? template.length;
    change(template.slice(0, start) + token + template.slice(end));
    requestAnimationFrame(() => {
      element?.focus();
      element?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-space-sm rounded-2xl bg-surface-container-low p-space-md"
    >
      <header className="flex flex-wrap items-center gap-space-sm">
        <h4 id={headingId} className="font-label-md text-label-md font-semibold text-on-surface">
          Mensaje que enviará Colibri
        </h4>
        {isCustom && (
          <Badge tone="info" icon="edit">
            Personalizado
          </Badge>
        )}
        <Button
          variant="ghost"
          startIcon={isEditing ? 'check' : 'edit'}
          onClick={() => setIsEditing((value) => !value)}
          aria-expanded={isEditing}
          className="ml-auto h-9 px-space-sm"
        >
          {isEditing ? 'Listo' : 'Editar mensaje'}
        </Button>
      </header>

      <p
        aria-live="polite"
        aria-label={`Vista previa de la respuesta sobre ${title}`}
        className={cx(
          'self-end max-w-[90%] rounded-2xl rounded-br-md bg-primary-container px-space-md py-space-sm font-body-md text-body-md whitespace-pre-wrap break-words text-on-primary-container',
          !preview.ready && 'opacity-70',
        )}
      >
        {preview.text || 'Sin texto'}
      </p>
      <PreviewStatus preview={preview} failed={failed} />

      {isEditing && (
        <div className="flex flex-col gap-space-sm">
          <TextArea
            ref={textareaRef}
            aria-label={`Plantilla de la respuesta sobre ${title}`}
            value={template}
            rows={4}
            maxLength={KNOWLEDGE_LIMITS.template}
            onChange={(event) => change(event.target.value)}
            className="bg-surface-container-lowest"
          />
          <div className="flex flex-col gap-space-xs">
            <span className="font-label-md text-label-md text-on-surface-variant">
              Toca un dato para agregarlo al mensaje. Se reemplaza por tu información al enviar.
            </span>
            <ul className="flex flex-wrap gap-space-xs">
              {status.variables.map((variable) => (
                <li key={variable.name}>
                  <button
                    type="button"
                    onClick={() => insert(variable.name)}
                    title={
                      variable.optional
                        ? 'Si está vacío, se omite.'
                        : 'Obligatorio para contestar solo.'
                    }
                    className="inline-flex items-center gap-1 rounded-full bg-surface-container-lowest px-3 py-1 font-label-md text-label-md text-on-surface shadow-hairline hover:bg-surface-container-high"
                  >
                    <Icon name="add" size={14} />
                    {variable.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {isCustom && (
            <Button
              variant="ghost"
              startIcon="restart_alt"
              onClick={() => onChange(null)}
              className="self-start"
            >
              Restaurar plantilla original
            </Button>
          )}
        </div>
      )}
    </section>
  );
}

function PreviewStatus({ preview, failed }: { preview: TopicStatus['preview']; failed: boolean }) {
  if (failed) {
    return (
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        La vista previa se actualizará cuando la información sea válida.
      </p>
    );
  }
  if (preview.unknown.length > 0) {
    return (
      <p role="alert" className="font-body-sm text-body-sm text-error">
        Estos datos no existen: {preview.unknown.map((name) => `{${name}}`).join(', ')}. Quítalos o
        usa los botones.
      </p>
    );
  }
  if (preview.missing.length > 0) {
    return (
      <p className="flex items-start gap-1 font-body-sm text-body-sm text-on-tertiary-fixed-variant">
        <Icon name="warning" size={16} className="mt-0.5 shrink-0" />
        Falta: {preview.missing.join(', ')}. Mientras tanto, Colibri no contestará solo esta
        consulta.
      </p>
    );
  }
  if (preview.text.length > KNOWLEDGE_LIMITS.template) {
    return (
      <p role="alert" className="font-body-sm text-body-sm text-error">
        El mensaje es demasiado largo ({preview.text.length} de {KNOWLEDGE_LIMITS.template}{' '}
        caracteres).
      </p>
    );
  }
  return (
    <p className="flex items-center gap-1 font-body-sm text-body-sm text-secondary">
      <Icon name="check_circle" size={16} />
      Listo para contestar solo.
    </p>
  );
}
