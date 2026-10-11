import { Card } from '../../components/ui';
import { comingSoonPath } from '../assistant';
import { QuickActionLink } from './QuickActionLink';

/**
 * Atajos a la configuración de respuestas. Las pantallas de SINPE y de feriados todavía no
 * existen: llevan a la pantalla "Próximamente".
 */
export function QuickActions() {
  return (
    <Card className="flex flex-col gap-space-sm p-space-lg md:p-space-lg">
      <h2 className="font-headline-sm text-headline-sm text-on-surface">
        Acciones rápidas de tu negocio
      </h2>
      <p className="font-body-md text-body-md text-on-surface-variant">
        Mantén al día tus datos de SINPE Móvil, horarios especiales y tarifas de encomienda.
      </p>
      <div className="mt-space-sm flex flex-col gap-space-sm">
        <QuickActionLink
          to={comingSoonPath('Datos de SINPE Móvil')}
          icon="payments"
          label="Actualizar número SINPE Móvil"
        />
        <QuickActionLink to="/mi-negocio#que-contesta" icon="rule" label="Qué contesta Colibri" />
        <QuickActionLink
          to={comingSoonPath('Horario de días feriados')}
          icon="schedule"
          label="Cambiar horario de feriados"
        />
      </div>
    </Card>
  );
}
