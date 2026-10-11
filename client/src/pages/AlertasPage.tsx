import { useState } from 'react';
import { AlertList, AlertsTabs, RiskSettingsPanel, type AlertsTab } from '../features/alerts';

/**
 * Alertas y comentarios delicados. Solo diseño por ahora: la detección de comentarios (etapa 5)
 * todavía no existe, así que cada sección muestra su aviso de "sin datos". Cuando exista el
 * servicio, basta con pasar las alertas y los ajustes reales a estos componentes.
 */
export function AlertasPage() {
  const [tab, setTab] = useState<AlertsTab>('nuevas');

  return (
    <div className="flex flex-col gap-space-xl">
      <header className="flex flex-col justify-between gap-space-md md:flex-row md:items-end">
        <div className="flex max-w-3xl flex-col gap-space-xs">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-surface-container-high px-2.5 py-0.5 font-label-md text-label-md font-semibold text-on-surface-variant">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-outline" />
            Monitoreo pendiente de activar
          </span>
          <h1 className="font-display-lg text-display-lg tracking-tight text-on-surface">
            Alertas y comentarios delicados
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Colibri vigila los comentarios públicos en tus redes para que cuides la reputación de tu
            negocio a tiempo.
          </p>
        </div>
        <AlertsTabs active={tab} counts={{ nuevas: null, historial: null }} onChange={setTab} />
      </header>

      <div className="grid items-start gap-space-lg xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-label={tab === 'nuevas' ? 'Alertas nuevas' : 'Historial de alertas'}>
          <AlertList tab={tab} alerts={[]} />
        </section>
        <aside>
          <RiskSettingsPanel settings={null} />
        </aside>
      </div>
    </div>
  );
}
