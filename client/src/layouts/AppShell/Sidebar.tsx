import { NavLink } from 'react-router';
import { Icon } from '../../components/Icon';
import { Logo } from '../../components/ui';
import { orNotAvailable } from '../../lib/format';
import { navItems, type NavItem } from './navigation';

interface SidebarProps {
  id: string;
  /** Solo aplica en pantallas pequeñas, donde el menú es un panel que se abre y se cierra. */
  isOpen: boolean;
  region: string | null;
  /** Valores de los contadores del menú; null o 0 no se muestran. */
  counters: Partial<Record<NonNullable<NavItem['counter']>, number | null>>;
  onNavigate: () => void;
}

const linkBase = 'flex items-center gap-space-sm rounded-xl px-space-md py-space-sm transition-all';
const linkIdle = 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface';
const linkActive = 'bg-primary-container font-semibold text-on-primary-container shadow-nav-active';

export function Sidebar({ id, isOpen, region, counters, onNavigate }: SidebarProps) {
  return (
    <aside
      id={id}
      className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between bg-surface-container-lowest px-space-md py-space-lg shadow-hairline transition-transform duration-200 lg:translate-x-0 lg:bg-surface-container-lowest/80 lg:backdrop-blur-xl ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex flex-col gap-space-lg">
        <div className="px-space-sm">
          <Logo tagline="Tu asistente de mensajes" />
        </div>

        <nav aria-label="Principal" className="flex flex-col gap-space-xs">
          {navItems.map((item) => {
            const count = item.counter ? counters[item.counter] : null;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}
              >
                <Icon name={item.icon} />
                <span className="flex-1 font-body-md text-body-md">{item.label}</span>
                {count ? (
                  <span className="min-w-6 rounded-full bg-primary-fixed px-1.5 text-center font-label-md text-label-md font-semibold text-on-primary-fixed-variant">
                    {count}
                    <span className="sr-only"> pendientes</span>
                  </span>
                ) : null}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="px-space-sm">
        <div className="flex flex-col gap-1 rounded-xl bg-surface-container-low p-space-sm">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
            Región
          </span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-secondary" aria-hidden="true" />
            <span className="font-body-sm text-body-sm font-medium text-on-surface">
              {orNotAvailable(region)}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
