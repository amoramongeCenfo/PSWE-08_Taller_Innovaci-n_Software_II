interface IconProps {
  /** Nombre del ícono en Material Symbols (ej. "home", "chat"). */
  name: string;
  /** Tamaño en px. Por defecto 20. */
  size?: number;
  /** Versión rellena del ícono. */
  filled?: boolean;
  className?: string;
}

/** Ícono decorativo. Si el ícono comunica algo por sí solo, agrega un texto accesible al botón/enlace que lo contiene. */
export function Icon({ name, size = 20, filled = false, className = '' }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${className}`}
      style={{
        fontSize: size,
        ...(filled ? { fontVariationSettings: "'FILL' 1" } : undefined),
      }}
    >
      {name}
    </span>
  );
}
