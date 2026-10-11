import { useCallback, useState } from 'react';
import { applyLargeText } from '../lib/largeText';

/** Estado del interruptor "Texto grande", compartido por toda la app a través de <html>. */
export function useLargeText() {
  const [enabled, setEnabled] = useState(() =>
    document.documentElement.classList.contains('texto-grande'),
  );
  const toggle = useCallback(() => {
    setEnabled((current) => {
      applyLargeText(!current);
      return !current;
    });
  }, []);
  return { enabled, toggle };
}
