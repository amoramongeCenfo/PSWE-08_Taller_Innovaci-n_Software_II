import { useNavigate } from 'react-router';
import { Icon } from '../../components/Icon';
import { IconButton } from '../../components/ui';
import { LargeTextToggle } from '../../components/LargeTextToggle';
import { listOrNotAvailable, orNotAvailable } from '../../lib/format';
import { comingSoonPath } from '../../features/assistant';
import { UserMenu } from './UserMenu';

interface TopbarProps {
  businessName: string | null;
  channels: readonly string[];
  userName: string | null;
  userRole: string | null;
  menuId: string;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onLogout: () => void;
}

export function Topbar({
  businessName,
  channels,
  userName,
  userRole,
  menuId,
  isMenuOpen,
  onToggleMenu,
  onLogout,
}: TopbarProps) {
  const navigate = useNavigate();
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between bg-surface-container-lowest/80 px-space-md shadow-hairline backdrop-blur-xl md:px-space-xl lg:left-64">
      <div className="flex min-w-0 items-center gap-space-sm md:gap-space-lg">
        <IconButton
          icon={isMenuOpen ? 'close' : 'menu'}
          label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={isMenuOpen}
          aria-controls={menuId}
          onClick={onToggleMenu}
          className="text-on-surface lg:hidden"
        />

        <div className="flex min-w-0 items-center gap-space-sm">
          <span
            aria-hidden="true"
            className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tertiary-fixed/50 text-on-tertiary-fixed-variant sm:flex"
          >
            <Icon name="storefront" size={22} />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-headline-sm text-headline-sm text-on-surface">
              {orNotAvailable(businessName)}
            </span>
            <span className="hidden min-w-0 items-center gap-1.5 md:flex">
              <span
                aria-hidden="true"
                className={`h-2 w-2 shrink-0 rounded-full ${channels.length ? 'bg-secondary' : 'bg-outline-variant'}`}
              />
              <span className="truncate font-label-sm text-label-sm text-on-surface-variant">
                {channels.length
                  ? `${listOrNotAvailable(channels)} ${channels.length === 1 ? 'conectado' : 'conectados'}`
                  : 'Sin canales conectados'}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-space-sm md:gap-space-md">
        <div className="flex items-center gap-space-xs text-on-surface-variant">
          <IconButton
            icon="search"
            label="Buscar"
            onClick={() => navigate(comingSoonPath('Buscar'))}
          />
          <IconButton
            icon="help_outline"
            label="Centro de ayuda"
            onClick={() => navigate(comingSoonPath('Centro de ayuda'))}
          />
        </div>

        <LargeTextToggle className="hidden md:block" />

        <div className="hidden h-6 w-px bg-surface-container-high sm:block" aria-hidden="true" />

        <UserMenu userName={userName} userRole={userRole} onLogout={onLogout} />
      </div>
    </header>
  );
}
