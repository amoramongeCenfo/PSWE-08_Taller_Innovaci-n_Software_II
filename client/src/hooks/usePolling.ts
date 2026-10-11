import { useEffect, useRef } from 'react';

/**
 * Ejecuta `callback` apenas se muestra el componente y luego cada `intervalMs` mientras la
 * pestaña esté visible.
 * Es la forma simple de mantener la pantalla al día; más adelante puede cambiarse por
 * WebSockets o SSE sin tocar las pantallas.
 */
export function usePolling(callback: () => void, intervalMs: number): void {
  const latest = useRef(callback);

  useEffect(() => {
    latest.current = callback;
  });

  useEffect(() => {
    latest.current();
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') latest.current();
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}
