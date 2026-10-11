import { Link } from 'react-router';
import { Icon } from '../../components/Icon';
import { ChannelLogo } from '../channels';
import { comingSoonPath } from '../assistant';

/** Recordatorio de que todo se puede cambiar después, y dónde pedir ayuda. */
export function ControlCard() {
  return (
    <section className="flex flex-col gap-space-md rounded-2xl bg-primary-fixed/30 p-space-lg">
      <div className="flex gap-space-sm">
        <Icon name="verified_user" className="shrink-0 text-primary" />
        <div className="flex flex-col gap-space-xs">
          <h2 className="font-body-lg text-body-lg font-semibold text-on-surface">
            Tienes el control siempre
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Puedes cambiar estas opciones cuando quieras desde <strong>Mi negocio</strong>.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-space-xs border-t border-outline-variant/50 pt-space-md">
        <span className="font-label-md text-label-md text-on-surface-variant">
          ¿Tienes dudas o necesitas ayuda?
        </span>
        <Link
          to={comingSoonPath('Ayuda por WhatsApp')}
          className="inline-flex items-center gap-space-xs font-body-md text-body-md font-semibold text-secondary hover:underline"
        >
          <ChannelLogo channel="whatsapp" />
          Escríbenos por WhatsApp
        </Link>
      </div>
    </section>
  );
}
