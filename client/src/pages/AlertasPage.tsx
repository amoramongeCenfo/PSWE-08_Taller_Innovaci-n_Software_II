import { useEffect, useState } from 'react';
import { alertsService } from '../features/alerts/alertsService';
import { AlertList, AlertsTabs, RiskSettingsPanel, type AlertsTab } from '../features/alerts';
import type { AlertSettings, ReputationAlert } from '../features/alerts/types';

const fetchAlertsData = () =>
  Promise.all([alertsService.listNew(), alertsService.listHistory(), alertsService.getSettings()]);

/**
 * Alertas y comentarios delicados. Etapa 5 del roadmap.
 * Consume el servicio de alertas (área de análisis) para mostrar comentarios con riesgo
 * reputacional detectados en las redes del negocio.
 */
export function AlertasPage() {
  const [tab, setTab] = useState<AlertsTab>('nuevas');
  const [nuevas, setNuevas] = useState<ReputationAlert[]>([]);
  const [historial, setHistorial] = useState<ReputationAlert[]>([]);
  const [settings, setSettings] = useState<AlertSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [fetchedNuevas, fetchedHistorial, fetchedSettings] = await fetchAlertsData();
        if (!cancelled) {
          setNuevas(fetchedNuevas);
          setHistorial(fetchedHistorial);
          setSettings(fetchedSettings);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Al marcar una alerta como atendida pasa de "Nuevas" al historial.
  async function handleMarkAttended(id: string) {
    try {
      await alertsService.markAttended(id);
      const [fetchedNuevas, fetchedHistorial] = await fetchAlertsData();
      setNuevas(fetchedNuevas);
      setHistorial(fetchedHistorial);
      setError(false);
    } catch {
      setError(true);
    }
  }

  const alerts = tab === 'nuevas' ? nuevas : historial;
  const isActive = settings !== null && !loading && !error;

  return (
    <div className="flex flex-col gap-space-xl">
      <header className="flex flex-col justify-between gap-space-md md:flex-row md:items-end">
        <div className="flex max-w-3xl flex-col gap-space-xs">
          {isActive ? (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 font-label-md text-label-md font-semibold text-primary">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-primary" />
              Monitoreo activo
            </span>
          ) : (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-surface-container-high px-2.5 py-0.5 font-label-md text-label-md font-semibold text-on-surface-variant">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-outline" />
              {loading
                ? 'Cargando…'
                : error
                  ? 'No se pudieron cargar las alertas'
                  : 'Monitoreo pendiente de activar'}
            </span>
          )}
          <h1 className="font-display-lg text-display-lg tracking-tight text-on-surface">
            Alertas y comentarios delicados
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Colibri vigila los comentarios públicos en tus redes para que cuides la reputación de tu
            negocio a tiempo.
          </p>
        </div>
        <AlertsTabs
          active={tab}
          counts={{ nuevas: nuevas.length || null, historial: historial.length || null }}
          onChange={setTab}
        />
      </header>

      <div className="grid items-start gap-space-lg xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-label={tab === 'nuevas' ? 'Alertas nuevas' : 'Historial de alertas'}>
          <AlertList tab={tab} alerts={alerts} onMarkAttended={handleMarkAttended} />
        </section>
        <aside>
          <RiskSettingsPanel settings={settings} />
        </aside>
      </div>
    </div>
  );
}
