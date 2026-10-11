import { LargeTextToggle } from '../../components/LargeTextToggle';
import { Avatar, Button, Logo } from '../../components/ui';
import { getInitials, orNotAvailable } from '../../lib/format';

interface WelcomeTopbarProps {
  businessName: string | null;
  userName: string | null;
  userRole: string | null;
  isSaving: boolean;
  onSkip: () => void;
}

/** Barra superior de la bienvenida: sin menú, para que la atención esté en los pasos. */
export function WelcomeTopbar({
  businessName,
  userName,
  userRole,
  isSaving,
  onSkip,
}: WelcomeTopbarProps) {
  const person = [userName, userRole].filter(Boolean).join(', ');
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-space-md bg-surface-container-lowest/85 px-space-md shadow-hairline backdrop-blur-xl md:px-space-xl">
      <Logo size={28} tagline="Tu asistente de mensajes" />
      <div className="flex items-center gap-space-sm sm:gap-space-md">
        <LargeTextToggle className="hidden md:block" />
        <Button
          variant="ghost"
          onClick={onSkip}
          disabled={isSaving}
          className="h-9 px-space-sm whitespace-nowrap sm:px-space-md"
        >
          Configurar después
        </Button>
        <div className="hidden flex-col text-right sm:flex">
          <span className="font-label-md text-label-md font-semibold text-on-surface">
            {orNotAvailable(businessName)}
          </span>
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            {person || 'N/A'}
          </span>
        </div>
        <Avatar initials={userName ? getInitials(userName) : ''} className="hidden sm:flex" />
      </div>
    </header>
  );
}
