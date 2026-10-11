import { Navigate, createBrowserRouter } from 'react-router';
import { RedirectIfAuthenticated, RequireAuth } from '../features/auth';
import { AppShell } from '../layouts/AppShell';
import { AuthLayout } from '../layouts/AuthLayout';
import { RequireOnboarding } from '../features/onboarding';

/**
 * Rutas de la aplicación. Las pantallas se cargan bajo demanda (code splitting).
 *
 * - Públicas (AuthLayout, sin menú): login. Si ya hay sesión, redirigen adentro.
 * - Protegidas (RequireAuth): sin sesión, llevan al login. La primera vez se abre /bienvenida
 *   (RequireOnboarding); después, todo vive dentro del AppShell (con menú).
 */
export const router = createBrowserRouter([
  {
    Component: RedirectIfAuthenticated,
    children: [
      {
        Component: AuthLayout,
        children: [
          {
            path: 'login',
            lazy: async () => ({
              Component: (await import('../pages/LoginPage')).LoginPage,
            }),
          },
        ],
      },
    ],
  },
  {
    path: '/',
    Component: RequireAuth,
    children: [
      {
        // Primer ingreso: bienvenida de 3 pasos, a pantalla completa y sin menú.
        path: 'bienvenida',
        lazy: async () => ({
          Component: (await import('../pages/BienvenidaPage')).BienvenidaPage,
        }),
      },
      {
        // Todo lo demás pide haber completado (u omitido) la bienvenida.
        Component: RequireOnboarding,
        children: [
          {
            Component: AppShell,
            children: [
              {
                index: true,
                lazy: async () => ({
                  Component: (await import('../pages/InicioPage')).InicioPage,
                }),
              },
              {
                // /mensajes muestra la bandeja; /mensajes/:conversationId abre una conversación.
                path: 'mensajes/:conversationId?',
                lazy: async () => ({
                  Component: (await import('../pages/MensajesPage')).MensajesPage,
                }),
              },
              {
                path: 'alertas',
                lazy: async () => ({
                  Component: (await import('../pages/AlertasPage')).AlertasPage,
                }),
              },
              {
                // Datos del negocio, redes, qué contesta Colibri y cómo habla.
                path: 'mi-negocio',
                lazy: async () => ({
                  Component: (await import('../pages/MiNegocioPage')).MiNegocioPage,
                }),
              },
              {
                path: 'historial',
                lazy: async () => ({
                  Component: (await import('../pages/HistorialPage')).HistorialPage,
                }),
              },
              // Direcciones anteriores: siguen funcionando.
              { path: 'configuracion', element: <Navigate to="/mi-negocio#redes" replace /> },
              {
                path: 'configuracion/perfil',
                element: <Navigate to="/mi-negocio#perfil" replace />,
              },
              {
                // Pantalla única para las opciones que todavía no están programadas.
                path: 'proximamente',
                lazy: async () => ({
                  Component: (await import('../pages/ProximamentePage')).ProximamentePage,
                }),
              },
              {
                path: '*',
                lazy: async () => ({
                  Component: (await import('../pages/NotFoundPage')).NotFoundPage,
                }),
              },
            ],
          },
        ],
      },
    ],
  },
]);
