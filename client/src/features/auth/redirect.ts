/** Ruta a la que se vuelve después de iniciar sesión cuando no hay una guardada. */
export const DEFAULT_AUTHENTICATED_PATH = '/';

/**
 * Obtiene la ruta de destino guardada por RequireAuth. Solo acepta rutas internas
 * para evitar redirecciones a sitios externos.
 */
export function getRedirectTarget(locationState: unknown): string {
  if (typeof locationState !== 'object' || locationState === null) {
    return DEFAULT_AUTHENTICATED_PATH;
  }
  const { from } = locationState as { from?: unknown };
  const isInternalPath = typeof from === 'string' && from.startsWith('/') && !from.startsWith('//');
  return isInternalPath && !from.startsWith('/login') ? from : DEFAULT_AUTHENTICATED_PATH;
}
