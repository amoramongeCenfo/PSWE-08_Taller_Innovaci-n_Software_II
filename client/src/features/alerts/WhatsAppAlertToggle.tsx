import { Switch } from '../../components/ui';
import { ChannelLogo } from '../channels';

interface WhatsAppAlertToggleProps {
  enabled: boolean;
  /** Número registrado que recibe el aviso; null si no hay ninguno. */
  phone: string | null;
  /** Sin manejador, el interruptor se muestra bloqueado. */
  onToggle?: () => void;
}

/** Avisar por WhatsApp a la persona cuando aparece una alerta de riesgo alto. */
export function WhatsAppAlertToggle({ enabled, phone, onToggle }: WhatsAppAlertToggleProps) {
  return (
    <section className="flex flex-col gap-space-xs border-t border-hairline pt-space-md">
      <div className="flex items-center justify-between gap-space-sm">
        <span className="inline-flex items-center gap-space-sm font-body-md text-body-md font-semibold text-on-surface">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary-fixed/30">
            <ChannelLogo channel="whatsapp" size={16} />
          </span>
          Avisarme por WhatsApp
        </span>
        <Switch
          label="Avisarme por WhatsApp"
          checked={enabled}
          onChange={() => onToggle?.()}
          disabled={!onToggle}
          className="[&>span:first-child]:sr-only"
        />
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        {phone
          ? `Te enviamos un mensaje al ${phone} en cuanto entre una alerta de riesgo alto.`
          : 'Te enviaremos un mensaje en cuanto entre una alerta de riesgo alto. Aún no hay un número registrado.'}
      </p>
    </section>
  );
}
