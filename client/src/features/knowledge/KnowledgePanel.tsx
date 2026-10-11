import { useEffect, useState } from 'react';
import { Alert, Button, Card, Spinner, TextAreaField, TextField } from '../../components/ui';
import { getErrorMessage } from '../../lib/http';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { hasInvalidHours, HoursEditor, WEEKDAYS_AFTER_MONDAY } from './HoursEditor';
import { fetchKnowledge, saveKnowledge } from './knowledgeSlice';
import { KnowledgeTopicSection } from './KnowledgeTopicSection';
import { TemplateEditor } from './TemplateEditor';
import { KNOWLEDGE_LIMITS, WEEK_DAYS, type AutoTopic, type KnowledgeView } from './types';
import { useKnowledgeDraft } from './useKnowledgeDraft';

/** "Lo que Colibri sabe de tu negocio": la información con la que contesta solo. */
export function KnowledgePanel() {
  const dispatch = useAppDispatch();
  const { status, view } = useAppSelector((state) => state.knowledge);

  // También vuelve a cargar después de cambiar el tono o el trato (las plantillas de fábrica cambian).
  useEffect(() => {
    if (status === 'idle') void dispatch(fetchKnowledge());
  }, [dispatch, status]);

  return (
    <Card id="lo-que-sabe" className="flex scroll-mt-24 flex-col gap-space-lg">
      <header className="flex flex-col gap-space-xs">
        <h2 className="font-headline-md text-headline-md text-on-surface">
          Lo que Colibri sabe de tu negocio
        </h2>
        <p className="max-w-2xl font-body-md text-body-md text-on-surface-variant">
          Con esta información Colibri contesta solo las consultas que marcaste como{' '}
          <strong className="font-semibold text-on-surface">Contesta solo</strong>. Si algo está
          vacío, esa consulta queda pendiente para ti.
        </p>
      </header>
      {status === 'error' && !view ? (
        <Alert tone="error">No pudimos cargar la información del negocio. Recarga la página.</Alert>
      ) : !view ? (
        <div role="status" className="flex items-center gap-space-sm text-on-surface-variant">
          <Spinner /> Cargando la información del negocio…
        </div>
      ) : (
        <KnowledgeForm view={view} />
      )}
    </Card>
  );
}

function KnowledgeForm({ view }: { view: KnowledgeView }) {
  const dispatch = useAppDispatch();
  const {
    draft,
    normalized,
    isDirty,
    setDay,
    copyDay,
    setField,
    setText,
    setTemplate,
    reset,
    replace,
  } = useKnowledgeDraft(view.knowledge);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const hoursInvalid = WEEK_DAYS.some((day) => hasInvalidHours(draft.hours.days[day]));

  const save = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const saved = await dispatch(saveKnowledge(normalized)).unwrap();
      replace(saved.knowledge);
      setMessage({ tone: 'success', text: 'Información guardada.' });
    } catch (err) {
      setMessage({ tone: 'error', text: getErrorMessage(err) });
    } finally {
      setIsSaving(false);
    }
  };

  const templateFor = (topic: AutoTopic, title: string) => (
    <TemplateEditor
      title={title}
      status={view.topics[topic]}
      custom={draft.templates[topic] ?? null}
      knowledge={normalized}
      onChange={(template) => setTemplate(topic, template)}
    />
  );

  return (
    <>
      <div className="flex flex-col gap-space-xl">
        <KnowledgeTopicSection
          topic="hours"
          stacked
          description="Colibri responde según el día y la hora de Costa Rica."
          template={templateFor('hours', 'horario')}
        >
          <HoursEditor
            hours={draft.hours}
            onDayChange={setDay}
            onCopyMonday={() => copyDay('mon', WEEKDAYS_AFTER_MONDAY)}
            onNotesChange={(notes) => setField('hours', 'notes', notes)}
          />
        </KnowledgeTopicSection>

        <KnowledgeTopicSection
          topic="location"
          description="Cómo llegar: dirección, señas y un enlace para el mapa."
          template={templateFor('location', 'ubicación')}
        >
          <TextField
            label="Dirección"
            placeholder="Ej.: Barrio Escalante, San José"
            value={draft.location.address ?? ''}
            maxLength={KNOWLEDGE_LIMITS.shortText}
            onChange={(event) => setField('location', 'address', event.target.value)}
          />
          <TextField
            label="Señas (opcional)"
            placeholder="Ej.: 100 m norte de la iglesia Santa Teresita"
            value={draft.location.landmarks ?? ''}
            maxLength={KNOWLEDGE_LIMITS.shortText}
            onChange={(event) => setField('location', 'landmarks', event.target.value)}
          />
          <TextField
            label="Enlace de Waze o Google Maps (opcional)"
            type="url"
            inputMode="url"
            placeholder="https://waze.com/ul/…"
            hint="Debe empezar con https://"
            value={draft.location.mapsUrl ?? ''}
            maxLength={KNOWLEDGE_LIMITS.url}
            onChange={(event) => setField('location', 'mapsUrl', event.target.value)}
          />
        </KnowledgeTopicSection>

        <KnowledgeTopicSection
          topic="pricing"
          description="Lo que cuestan tus productos o servicios y cómo te pueden pagar."
          template={templateFor('pricing', 'precios y pagos')}
        >
          <TextAreaField
            label="Precios"
            placeholder="Ej.: El café de 340 g cuesta ₡6.500 y las tazas desde ₡8.000."
            value={draft.payments.prices ?? ''}
            maxLength={KNOWLEDGE_LIMITS.longText}
            onChange={(event) => setField('payments', 'prices', event.target.value)}
          />
          <TextField
            label="Métodos de pago (opcional)"
            placeholder="Ej.: efectivo, tarjeta y SINPE Móvil"
            value={draft.payments.methods ?? ''}
            maxLength={KNOWLEDGE_LIMITS.shortText}
            onChange={(event) => setField('payments', 'methods', event.target.value)}
          />
          <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
            <TextField
              label="SINPE Móvil (opcional)"
              inputMode="numeric"
              placeholder="8888-7777"
              hint="8 dígitos"
              value={draft.payments.sinpeNumber ?? ''}
              maxLength={20}
              onChange={(event) => setField('payments', 'sinpeNumber', event.target.value)}
            />
            <TextField
              label="A nombre de (opcional)"
              placeholder="Ej.: Café Pura Vida"
              value={draft.payments.sinpeName ?? ''}
              maxLength={KNOWLEDGE_LIMITS.shortText}
              onChange={(event) => setField('payments', 'sinpeName', event.target.value)}
            />
          </div>
        </KnowledgeTopicSection>

        <KnowledgeTopicSection
          topic="availability"
          description="Qué hay disponible y qué se hace por encargo."
          template={templateFor('availability', 'disponibilidad')}
        >
          <TextAreaField
            label="Disponibilidad"
            placeholder="Ej.: Tenemos café en grano y molido todos los días; las tazas pintadas a mano se hacen por encargo."
            value={draft.availability ?? ''}
            maxLength={KNOWLEDGE_LIMITS.longText}
            onChange={(event) => setText('availability', event.target.value)}
          />
        </KnowledgeTopicSection>

        <KnowledgeTopicSection
          topic="shipping"
          description="Si haces envíos, a dónde, con quién y cuánto cuestan."
          template={templateFor('shipping', 'envíos')}
        >
          <TextAreaField
            label="Envíos"
            placeholder="Ej.: Enviamos por Correos de Costa Rica a todo el país (₡3.000). En el GAM, entrega en 24 horas."
            value={draft.shipping ?? ''}
            maxLength={KNOWLEDGE_LIMITS.longText}
            onChange={(event) => setText('shipping', event.target.value)}
          />
        </KnowledgeTopicSection>

        <KnowledgeTopicSection
          topic="orders"
          description="Cómo se hace un encargo, con cuánta anticipación y si se paga por adelantado."
          template={templateFor('orders', 'encargos')}
        >
          <TextAreaField
            label="Encargos"
            placeholder="Ej.: Los encargos se hacen con 3 días de anticipación y con el 50 % por adelantado."
            value={draft.orders ?? ''}
            maxLength={KNOWLEDGE_LIMITS.longText}
            onChange={(event) => setText('orders', event.target.value)}
          />
        </KnowledgeTopicSection>
      </div>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-end gap-space-sm rounded-2xl bg-surface-container-lowest/90 p-space-md shadow-card backdrop-blur-xl">
        {message && (
          <div className="mr-auto">
            <Alert tone={message.tone}>{message.text}</Alert>
          </div>
        )}
        <Button variant="ghost" onClick={reset} disabled={!isDirty || isSaving}>
          Descartar cambios
        </Button>
        <Button onClick={() => void save()} loading={isSaving} disabled={!isDirty || hoursInvalid}>
          Guardar información
        </Button>
      </div>
    </>
  );
}
