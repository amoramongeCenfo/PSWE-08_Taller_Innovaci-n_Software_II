import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { FullScreenLoader } from '../components/FullScreenLoader';
import { Icon } from '../components/Icon';
import { Alert, Button } from '../components/ui';
import {
  BlockedTopicsEditor,
  ChannelsOverview,
  ReplyRulesEditor,
  VoiceEditor,
  comingSoonPath,
  fetchAssistantSettings,
  saveAssistantSettings,
  useAssistantDraft,
  type AssistantSettings,
} from '../features/assistant';
import { useAuth } from '../features/auth';
import { fetchBusinessProfile } from '../features/business';
import { fetchChannels } from '../features/channels';
import {
  ControlCard,
  ONBOARDING_STEPS,
  OnboardingStepper,
  SampleVideoCard,
  WelcomeTopbar,
} from '../features/onboarding';
import { getErrorMessage } from '../lib/http';
import { useAppDispatch, useAppSelector } from '../store/hooks';

/**
 * Bienvenida de tres pasos. Se abre sola la primera vez que alguien entra (RequireOnboarding).
 * Al terminar o elegir "Configurar después" se marca como completa y lleva al Inicio.
 */
export function BienvenidaPage() {
  const dispatch = useAppDispatch();
  const { status, settings } = useAppSelector((state) => state.assistant);

  useEffect(() => {
    void dispatch(fetchAssistantSettings());
    void dispatch(fetchChannels());
    void dispatch(fetchBusinessProfile());
  }, [dispatch]);

  if (status === 'error') {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-space-md p-space-md">
        <Alert tone="error">No pudimos cargar tu configuración. Revisa tu conexión.</Alert>
        <Button onClick={() => void dispatch(fetchAssistantSettings())}>Intentar de nuevo</Button>
        <Link to="/" className="text-center font-body-md text-body-md text-primary">
          Ir al inicio
        </Link>
      </main>
    );
  }
  if (!settings) return <FullScreenLoader label="Preparando tu bienvenida…" />;

  return <WelcomeWizard settings={settings} />;
}

function WelcomeWizard({ settings }: { settings: AssistantSettings }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const businessName = useAppSelector((state) => state.business.profile?.name ?? null);
  const { draft, normalized, setRule, update } = useAssistantDraft(settings);
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const panelRef = useRef<HTMLHeadingElement>(null);

  const isLast = step === ONBOARDING_STEPS.length - 1;
  const current = ONBOARDING_STEPS[step]!;
  const firstName = user?.name?.trim().split(/\s+/)[0];

  const goTo = (next: number) => {
    setStep(next);
    setReached((r) => Math.max(r, next));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    panelRef.current?.focus({ preventScroll: true });
  };

  const finish = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await dispatch(
        saveAssistantSettings({ input: normalized, completeOnboarding: true }),
      ).unwrap();
      setFinished(true);
      navigate('/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setIsSaving(false);
    }
  };

  // Ya estaba completa (por ejemplo, alguien abrió /bienvenida a mano): al Inicio.
  if (settings.onboardingCompletedAt && !finished && !isSaving) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      <WelcomeTopbar
        businessName={businessName}
        userName={user?.name ?? null}
        userRole={user?.role ?? null}
        isSaving={isSaving}
        onSkip={() => void finish()}
      />

      <main className="mx-auto flex max-w-6xl flex-col gap-space-xl px-space-md pt-space-xl pb-40 md:px-space-xl">
        <header className="mx-auto flex max-w-2xl flex-col gap-space-sm text-center">
          <h1 className="font-display-lg text-display-lg tracking-tight text-balance text-on-surface">
            {firstName ? `¡Hola, ${firstName}! ` : '¡Hola! '}Dejemos Colibri listo en 3 pasos
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Configura cómo atiende Colibri a tus clientes por WhatsApp, Instagram y Messenger.
          </p>
        </header>

        <div className="mx-auto w-full max-w-3xl">
          <OnboardingStepper current={step} reached={reached} onSelect={goTo} />
        </div>

        <div className="grid items-start gap-space-lg lg:grid-cols-[minmax(0,1fr)_340px]">
          <section
            aria-labelledby="paso-titulo"
            className="flex flex-col gap-space-lg rounded-2xl bg-surface-container-lowest p-space-lg shadow-card md:p-space-xl"
          >
            <header className="flex flex-col gap-space-xs">
              <span className="font-label-md text-label-md font-semibold text-primary">
                Paso {step + 1} de {ONBOARDING_STEPS.length}
              </span>
              <h2
                id="paso-titulo"
                ref={panelRef}
                tabIndex={-1}
                className="font-headline-md text-headline-md text-on-surface outline-none"
              >
                {current.heading}
              </h2>
              <p className="max-w-2xl font-body-md text-body-md text-on-surface-variant">
                {current.description}
              </p>
            </header>

            {step === 0 && <ChannelsOverview />}

            {step === 1 && (
              <>
                <ReplyRulesEditor rules={draft.rules} onChange={setRule} />
                <hr className="border-hairline" />
                <BlockedTopicsEditor
                  topics={draft.blockedTopics}
                  onChange={(topics) => update('blockedTopics', topics)}
                />
              </>
            )}

            {step === 2 && (
              <VoiceEditor
                value={draft}
                businessName={businessName}
                onToneChange={(tone) => update('tone', tone)}
                onTreatmentChange={(treatment) => update('treatment', treatment)}
                onSignatureChange={(signature) => update('signature', signature)}
              />
            )}
          </section>

          <aside className="flex flex-col gap-space-lg">
            <SampleVideoCard />
            <ControlCard />
          </aside>
        </div>
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-30 bg-surface-container-lowest/90 shadow-hairline backdrop-blur-xl">
        {error && (
          <div className="mx-auto max-w-6xl px-space-md pt-space-sm md:px-space-xl">
            <Alert tone="error">{error}</Alert>
          </div>
        )}
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-space-md px-space-md py-space-md md:px-space-xl">
          <Button
            variant="secondary"
            startIcon="arrow_back"
            onClick={() => goTo(step - 1)}
            disabled={step === 0 || isSaving}
          >
            Atrás
          </Button>

          <Link
            to={comingSoonPath('Planes y prueba gratis')}
            className="hidden items-center gap-space-xs rounded-full bg-secondary-fixed/30 px-space-md py-1.5 font-label-md text-label-md text-on-secondary-fixed-variant hover:bg-secondary-fixed/50 md:inline-flex"
          >
            <Icon name="check_circle" size={16} filled />
            Prueba gratis por 30 días
          </Link>

          {isLast ? (
            <Button onClick={() => void finish()} loading={isSaving}>
              Terminar y entrar
            </Button>
          ) : (
            <Button onClick={() => goTo(step + 1)} disabled={isSaving}>
              Siguiente
              <Icon name="arrow_forward" size={18} />
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
