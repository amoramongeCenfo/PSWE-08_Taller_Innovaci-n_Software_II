import { useCallback, useMemo, useState } from 'react';
import type { AssistantSettings, AssistantSettingsInput, ReplyMode, TopicId } from './types';

const toInput = ({
  onboardingCompletedAt: _done,
  ...input
}: AssistantSettings): AssistantSettingsInput => input;

/**
 * Copia editable de los ajustes. Los cambios no se guardan hasta llamar a guardar desde la
 * pantalla; así se puede avanzar y retroceder entre pasos sin perder nada.
 */
export function useAssistantDraft(settings: AssistantSettings) {
  const initial = useMemo(() => toInput(settings), [settings]);
  const [draft, setDraft] = useState<AssistantSettingsInput>(initial);

  const setRule = useCallback(
    (topic: TopicId, mode: ReplyMode) =>
      setDraft((d) => ({ ...d, rules: { ...d.rules, [topic]: mode } })),
    [],
  );
  const update = useCallback(
    <K extends keyof AssistantSettingsInput>(key: K, value: AssistantSettingsInput[K]) =>
      setDraft((d) => ({ ...d, [key]: value })),
    [],
  );
  const reset = useCallback(() => setDraft(initial), [initial]);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(initial);
  /** Lo que se envía al servidor: la firma vacía se guarda como null. */
  const normalized: AssistantSettingsInput = {
    ...draft,
    signature: draft.signature?.trim() || null,
  };

  return { draft, normalized, isDirty, setRule, update, reset };
}
