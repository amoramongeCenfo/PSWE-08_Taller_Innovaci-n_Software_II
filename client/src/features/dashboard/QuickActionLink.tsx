import { Link } from 'react-router';
import { Icon } from '../../components/Icon';

interface QuickActionLinkProps {
  to: string;
  icon: string;
  label: string;
}

/** Atajo a una tarea frecuente: ícono, texto y flecha. */
export function QuickActionLink({ to, icon, label }: QuickActionLinkProps) {
  return (
    <Link
      to={to}
      className="flex items-center gap-space-sm rounded-xl bg-surface-container-low px-space-md py-space-sm font-body-md text-body-md font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
    >
      <Icon name={icon} className="text-primary" />
      <span className="flex-1">{label}</span>
      <Icon name="chevron_right" className="text-outline" />
    </Link>
  );
}
