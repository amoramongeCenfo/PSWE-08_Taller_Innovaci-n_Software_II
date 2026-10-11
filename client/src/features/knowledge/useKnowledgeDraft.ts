import { useCallback, useMemo, useState } from 'react';
import type { AutoTopic, BusinessKnowledge, DayHours, WeekDay } from './types';

/** Bloques con varios campos. */
type Section = 'hours' | 'location' | 'payments';

/**
 * Copia editable de la información del negocio. Nada se guarda hasta llamar a guardar desde la
 * pantalla. Los textos vacíos se envían como null (el servidor también los limpia).
 */
export function useKnowledgeDraft(saved: BusinessKnowledge) {
  const [draft, setDraft] = useState<BusinessKnowledge>(saved);

  const setDay = useCallback(
    (day: WeekDay, hours: DayHours) =>
      setDraft((d) => ({ ...d, hours: { ...d.hours, days: { ...d.hours.days, [day]: hours } } })),
    [],
  );

  /** Copia el horario de un día a otros (por ejemplo, de lunes al resto de días hábiles). */
  const copyDay = useCallback(
    (from: WeekDay, to: WeekDay[]) =>
      setDraft((d) => {
        const days = { ...d.hours.days };
        for (const day of to) days[day] = structuredClone(d.hours.days[from]);
        return { ...d, hours: { ...d.hours, days } };
      }),
    [],
  );

  const setField = useCallback(
    <S extends Section, K extends keyof BusinessKnowledge[S]>(
      section: S,
      key: K,
      value: BusinessKnowledge[S][K],
    ) => setDraft((d) => ({ ...d, [section]: { ...d[section], [key]: value } })),
    [],
  );

  const setText = useCallback(
    (key: 'shipping' | 'availability' | 'orders', value: string) =>
      setDraft((d) => ({ ...d, [key]: value })),
    [],
  );

  /** Guarda una plantilla personalizada; null vuelve a la de fábrica. */
  const setTemplate = useCallback(
    (topic: AutoTopic, template: string | null) =>
      setDraft((d) => {
        const templates = { ...d.templates };
        if (template === null) delete templates[topic];
        else templates[topic] = template;
        return { ...d, templates };
      }),
    [],
  );

  const reset = useCallback(() => setDraft(saved), [saved]);

  const normalized = useMemo(() => normalize(draft), [draft]);
  const isDirty = JSON.stringify(normalized) !== JSON.stringify(normalize(saved));

  return {
    draft,
    normalized,
    isDirty,
    setDay,
    copyDay,
    setField,
    setText,
    setTemplate,
    reset,
    replace: setDraft,
  };
}

const clean = (value: string | null) => value?.trim() || null;

function normalize(k: BusinessKnowledge): BusinessKnowledge {
  return {
    hours: { days: k.hours.days, notes: clean(k.hours.notes) },
    location: {
      address: clean(k.location.address),
      landmarks: clean(k.location.landmarks),
      mapsUrl: clean(k.location.mapsUrl),
    },
    payments: {
      methods: clean(k.payments.methods),
      sinpeNumber: clean(k.payments.sinpeNumber),
      sinpeName: clean(k.payments.sinpeName),
      prices: clean(k.payments.prices),
    },
    shipping: clean(k.shipping),
    availability: clean(k.availability),
    orders: clean(k.orders),
    templates: Object.fromEntries(
      Object.entries(k.templates).filter(([, template]) => template?.trim()),
    ),
  };
}
