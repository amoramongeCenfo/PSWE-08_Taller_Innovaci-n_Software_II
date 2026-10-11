interface SpinnerProps {
  /** Tamaño en px. Por defecto 18. */
  size?: number;
  className?: string;
}

/** Indicador de carga decorativo. Acompáñalo siempre de un texto o de aria-busy en su contenedor. */
export function Spinner({ size = 18, className = '' }: SpinnerProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      className={`animate-spin ${className}`}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
