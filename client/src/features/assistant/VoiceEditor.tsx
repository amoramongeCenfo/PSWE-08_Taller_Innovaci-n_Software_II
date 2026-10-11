import { useId } from 'react';
import { Icon } from '../../components/Icon';
import { SegmentedControl, TextField } from '../../components/ui';
import { cx } from '../../lib/cx';
import { TONE_OPTIONS, TREATMENT_OPTIONS, buildSampleReply } from './voice';
import { ASSISTANT_LIMITS, type AssistantSettingsInput, type Tone, type Treatment } from './types';

interface VoiceEditorProps {
  value: Pick<AssistantSettingsInput, 'tone' | 'treatment' | 'signature'>;
  businessName: string | null;
  onToneChange: (tone: Tone) => void;
  onTreatmentChange: (treatment: Treatment) => void;
  onSignatureChange: (signature: string) => void;
}

/** Cómo habla el negocio: estilo, trato y firma, con una vista previa de una respuesta. */
export function VoiceEditor({
  value,
  businessName,
  onToneChange,
  onTreatmentChange,
  onSignatureChange,
}: VoiceEditorProps) {
  const toneLabelId = useId();
  const treatment = TREATMENT_OPTIONS.find((option) => option.value === value.treatment);

  return (
    <div className="flex flex-col gap-space-lg">
      <fieldset className="flex flex-col gap-space-sm">
        <legend id={toneLabelId} className="mb-space-sm font-body-lg text-body-lg font-semibold">
          Estilo de las respuestas
        </legend>
        <div className="grid gap-space-sm sm:grid-cols-3">
          {TONE_OPTIONS.map((option) => {
            const checked = option.value === value.tone;
            return (
              <label
                key={option.value}
                className={cx(
                  'flex cursor-pointer flex-col gap-space-xs rounded-2xl p-space-md transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary-container',
                  checked
                    ? 'bg-primary-fixed/50 ring-2 ring-primary-container'
                    : 'bg-surface-container-lowest shadow-hairline hover:bg-surface-container-low',
                )}
              >
                <input
                  type="radio"
                  name="tone"
                  value={option.value}
                  checked={checked}
                  onChange={() => onToneChange(option.value)}
                  className="sr-only"
                />
                <Icon
                  name={option.icon}
                  className={checked ? 'text-primary' : 'text-on-surface-variant'}
                />
                <span className="font-body-lg text-body-lg font-semibold text-on-surface">
                  {option.title}
                </span>
                <span className="font-body-md text-body-md text-on-surface-variant">
                  {option.description}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-space-sm">
        <span className="font-body-lg text-body-lg font-semibold text-on-surface">
          ¿Cómo trata a sus clientes?
        </span>
        <div className="flex flex-wrap items-center gap-space-md">
          <SegmentedControl
            label="Trato a los clientes"
            options={TREATMENT_OPTIONS}
            value={value.treatment}
            onChange={onTreatmentChange}
          />
          {treatment && (
            <span className="font-body-md text-body-md text-on-surface-variant">
              Ej.: “{treatment.example}”
            </span>
          )}
        </div>
      </div>

      <TextField
        label="Firma al final de las respuestas (opcional)"
        hint="Por ejemplo: el nombre del negocio o “Equipo de atención”."
        value={value.signature ?? ''}
        maxLength={ASSISTANT_LIMITS.signature}
        onChange={(event) => onSignatureChange(event.target.value)}
      />

      <figure className="flex flex-col gap-space-sm rounded-2xl bg-surface-container-low p-space-md">
        <figcaption className="font-label-md text-label-md text-on-surface-variant">
          Así respondería Colibri a “¿A qué hora abren hoy?”
        </figcaption>
        <div className="flex flex-col items-end gap-1">
          <p className="max-w-md rounded-2xl rounded-br-md bg-primary-container px-space-md py-space-sm font-body-md text-body-md text-on-primary-container">
            {buildSampleReply(value.tone, value.treatment, value.signature)}
          </p>
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            {businessName?.trim() || 'Tu negocio'} · respuesta de ejemplo
          </span>
        </div>
      </figure>
    </div>
  );
}
