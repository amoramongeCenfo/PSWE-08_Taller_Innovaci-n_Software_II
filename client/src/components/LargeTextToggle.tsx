import { useLargeText } from '../hooks/useLargeText';
import { Switch } from './ui';

/** Interruptor "Texto grande" para las barras superiores. */
export function LargeTextToggle({ className }: { className?: string }) {
  const { enabled, toggle } = useLargeText();
  // El contenedor controla si se ve (por ejemplo "hidden md:block"); el botón no lo pisa.
  return (
    <div className={className}>
      <Switch label="Texto grande" checked={enabled} onChange={toggle} />
    </div>
  );
}
