import { Icon } from '../../components/Icon';
import { Card } from '../../components/ui';
import { KeywordList } from './KeywordList';
import { SensitivityControl } from './SensitivityControl';
import type { AlertSettings } from './types';
import { WhatsAppAlertToggle } from './WhatsAppAlertToggle';

interface RiskSettingsPanelProps {
  /** null mientras no exista el servicio de alertas: se muestran los valores iniciales, bloqueados. */
  settings: AlertSettings | null;
}

const INITIAL: AlertSettings = {
  sensitivity: 'normal',
  keywords: [],
  notifyByWhatsApp: false,
  whatsAppNumber: null,
};

/** Cómo decide Colibri qué es un riesgo: sensibilidad, palabras clave y aviso por WhatsApp. */
export function RiskSettingsPanel({ settings }: RiskSettingsPanelProps) {
  const current = settings ?? INITIAL;
  return (
    <Card className="flex flex-col gap-space-lg p-space-lg md:p-space-lg">
      <header className="flex flex-col gap-space-xs">
        <h2 className="flex items-center gap-space-sm font-headline-sm text-headline-sm text-on-surface">
          <Icon name="tune" className="text-primary" />
          ¿Qué considero riesgo alto?
        </h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Ajusta la sensibilidad con la que Colibri analiza los comentarios públicos.
        </p>
        {!settings && (
          <p className="mt-space-xs rounded-lg bg-surface-container-low px-space-sm py-space-xs font-label-md text-label-md text-on-surface-variant">
            Disponible cuando se active el monitoreo de comentarios.
          </p>
        )}
      </header>

      <SensitivityControl value={current.sensitivity} />
      <KeywordList keywords={current.keywords} />
      <WhatsAppAlertToggle enabled={current.notifyByWhatsApp} phone={current.whatsAppNumber} />

      <p className="flex gap-space-sm rounded-xl bg-primary-fixed/25 p-space-sm font-body-sm text-body-sm text-on-surface-variant">
        <Icon name="info" size={18} className="shrink-0 text-primary" />
        Colibri no decide si un comentario es verdadero o falso; solo te avisa con prontitud para
        que tú tomes la decisión final.
      </p>
    </Card>
  );
}
