import { useEffect, useState } from 'react';
import { Alert, Button, Card, Spinner, Switch } from '../../components/ui';
import { getErrorMessage } from '../../lib/http';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchKnowledge } from '../knowledge/knowledgeSlice';
import { topicNotice } from '../knowledge/readiness';
import { fetchAssistantSettings, saveAssistantSettings } from './assistantSlice';
import { BlockedTopicsEditor } from './BlockedTopicsEditor';
import { ChannelsOverview } from './ChannelsOverview';
import { ReplyRulesEditor } from './ReplyRulesEditor';
import type { AssistantSettings } from './types';
import { useAssistantDraft } from './useAssistantDraft';
import { VoiceEditor } from './VoiceEditor';

/** Redes, qué contesta Colibri y cómo habla el negocio: los pasos de la bienvenida, editables. */
export function AssistantSettingsPanel() {
  const dispatch = useAppDispatch();
  const { status, settings } = useAppSelector((state) => state.assistant);

  useEffect(() => {
    void dispatch(fetchAssistantSettings());
  }, [dispatch]);

  if (status === 'error') {
    return <Alert tone="error">No pudimos cargar cómo atiende Colibri. Recarga la página.</Alert>;
  }
  if (!settings) {
    return (
      <div role="status" className="flex items-center gap-space-sm text-on-surface-variant">
        <Spinner /> Cargando cómo atiende Colibri…
      </div>
    );
  }
  return <SettingsForm settings={settings} />;
}

function SettingsForm({ settings }: { settings: AssistantSettings }) {
  const dispatch = useAppDispatch();
  const businessName = useAppSelector((state) => state.business.profile?.name ?? null);
  const knowledge = useAppSelector((state) => state.knowledge.view);
  const { draft, normalized, isDirty, setRule, update, reset } = useAssistantDraft(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  // Los avisos de información faltante dependen de lo que Colibri sabe del negocio.
  useEffect(() => {
    void dispatch(fetchKnowledge());
  }, [dispatch]);

  const save = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      await dispatch(saveAssistantSettings({ input: normalized })).unwrap();
      setMessage({ tone: 'success', text: 'Cambios guardados.' });
    } catch (err) {
      setMessage({ tone: 'error', text: getErrorMessage(err) });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Card id="redes" className="flex scroll-mt-24 flex-col gap-space-md">
        <SectionHeader
          title="Tus redes"
          description="Las redes conectadas muestran sus mensajes en la bandeja."
        />
        <ChannelsOverview />
      </Card>

      <Card id="que-contesta" className="flex scroll-mt-24 flex-col gap-space-lg">
        <SectionHeader
          title="Qué contesta Colibri"
          description="Para cada consulta, elige si Colibri responde solo, si te pide autorización primero o si tú te encargas."
        />
        <div className="flex flex-col gap-space-sm rounded-2xl bg-surface-container-low p-space-md sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="font-body-lg text-body-lg font-semibold text-on-surface">
              Pausar respuestas automáticas
            </span>
            <span className="font-body-md text-body-md text-on-surface-variant">
              {draft.autoReplyPaused
                ? 'Colibri no está contestando solo: todas las consultas quedan pendientes para ti.'
                : 'Úsalo si necesitas atender todo en persona por un tiempo.'}
            </span>
          </div>
          <Switch
            label={draft.autoReplyPaused ? 'En pausa' : 'Activas'}
            checked={draft.autoReplyPaused}
            onChange={() => update('autoReplyPaused', !draft.autoReplyPaused)}
            className="self-start sm:self-center"
          />
        </div>
        <ReplyRulesEditor
          rules={draft.rules}
          onChange={setRule}
          noticeFor={(topic, mode) =>
            draft.autoReplyPaused ? null : topicNotice(topic, mode, knowledge)
          }
        />
        <hr className="border-hairline" />
        <BlockedTopicsEditor
          topics={draft.blockedTopics}
          onChange={(topics) => update('blockedTopics', topics)}
        />
      </Card>

      <Card id="como-habla" className="flex scroll-mt-24 flex-col gap-space-lg">
        <SectionHeader
          title="Cómo habla tu negocio"
          description="El estilo y el trato que usa Colibri en todas sus respuestas."
        />
        <VoiceEditor
          value={draft}
          businessName={businessName}
          onToneChange={(tone) => update('tone', tone)}
          onTreatmentChange={(treatment) => update('treatment', treatment)}
          onSignatureChange={(signature) => update('signature', signature)}
        />
      </Card>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-end gap-space-sm rounded-2xl bg-surface-container-lowest/90 p-space-md shadow-card backdrop-blur-xl">
        {message && (
          <div className="mr-auto">
            <Alert tone={message.tone}>{message.text}</Alert>
          </div>
        )}
        <Button variant="ghost" onClick={reset} disabled={!isDirty || isSaving}>
          Descartar cambios
        </Button>
        <Button onClick={() => void save()} loading={isSaving} disabled={!isDirty}>
          Guardar cambios
        </Button>
      </div>
    </>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="flex flex-col gap-space-xs">
      <h2 className="font-headline-md text-headline-md text-on-surface">{title}</h2>
      <p className="max-w-2xl font-body-md text-body-md text-on-surface-variant">{description}</p>
    </header>
  );
}
