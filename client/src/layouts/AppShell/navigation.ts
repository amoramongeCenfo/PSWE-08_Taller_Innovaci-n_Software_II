export interface NavItem {
  to: string;
  label: string;
  /** Nombre del ícono en Material Symbols. */
  icon: string;
  /** Si es true, solo está activo cuando la ruta coincide exactamente. */
  end?: boolean;
  /** Contador a mostrar junto a la opción (por ejemplo, mensajes pendientes). */
  counter?: 'pendingConversations';
}

/** Opciones del menú lateral, en el orden en que se muestran. */
export const navItems: readonly NavItem[] = [
  { to: '/', label: 'Inicio', icon: 'home', end: true },
  { to: '/mensajes', label: 'Mensajes', icon: 'chat', counter: 'pendingConversations' },
  { to: '/alertas', label: 'Alertas', icon: 'notifications' },
  { to: '/mi-negocio', label: 'Mi negocio', icon: 'storefront' },
  { to: '/historial', label: 'Historial', icon: 'history' },
];
