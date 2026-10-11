import { useCallback, useEffect, useState } from 'react';
import { Outlet } from 'react-router';
import { useAuth } from '../../features/auth';
import { fetchBusinessProfile } from '../../features/business';
import { fetchChannels, selectActiveChannelNames } from '../../features/channels';
import { selectPendingConversationCount, useConversationsPolling } from '../../features/messages';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const MENU_ID = 'menu-principal';
const COUNTERS_REFRESH_MS = 30_000;

/**
 * Marco de la aplicación autenticada: menú lateral + barra superior + área de contenido.
 * Cada pantalla se muestra dentro de <Outlet />. Se usa siempre detrás de RequireAuth.
 * Las pantallas sin menú (por ejemplo el login) viven en AuthLayout.
 */
export function AppShell() {
  const { user, logout } = useAuth();
  const dispatch = useAppDispatch();
  const business = useAppSelector((state) => state.business.profile);
  const channelNames = useAppSelector(selectActiveChannelNames);
  const pendingConversations = useAppSelector(selectPendingConversationCount);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // El contador de Mensajes del menú se mantiene al día en cualquier pantalla.
  useConversationsPolling(COUNTERS_REFRESH_MS);
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  useEffect(() => {
    void dispatch(fetchBusinessProfile());
    void dispatch(fetchChannels());
  }, [dispatch]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isMenuOpen]);

  if (!user) return null;

  return (
    <>
      <a
        href="#contenido"
        className="sr-only z-60 rounded-xl bg-primary-container px-space-md py-space-sm text-on-primary-container focus:not-sr-only focus:fixed focus:left-space-md focus:top-space-md"
      >
        Saltar al contenido
      </a>

      <Sidebar
        id={MENU_ID}
        isOpen={isMenuOpen}
        region={business?.region ?? null}
        counters={{ pendingConversations }}
        onNavigate={closeMenu}
      />

      {isMenuOpen && (
        <div
          aria-hidden="true"
          onClick={closeMenu}
          className="fixed inset-0 z-45 bg-inverse-surface/40 lg:hidden"
        />
      )}

      <div className="lg:pl-64">
        <Topbar
          businessName={business?.name ?? null}
          channels={channelNames}
          userName={user.name}
          userRole={user.role}
          menuId={MENU_ID}
          isMenuOpen={isMenuOpen}
          onToggleMenu={() => setIsMenuOpen((open) => !open)}
          onLogout={() => void logout()}
        />
        <main id="contenido" className="min-h-screen px-space-md pt-16 md:px-margin-desktop">
          <div className="mx-auto w-full max-w-7xl py-space-xl">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
}
