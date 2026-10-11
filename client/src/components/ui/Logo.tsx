import logo from '../../assets/images/logo-128.png';

interface LogoProps {
  /** Tamaño del colibrí en px. Por defecto 32. */
  size?: number;
  /** Muestra el nombre "Colibri" junto al logo. */
  showName?: boolean;
  /** Texto pequeño debajo del nombre. Solo se ve si showName es true. */
  tagline?: string;
}

export function Logo({ size = 32, showName = true, tagline }: LogoProps) {
  return (
    <div className="flex items-center gap-space-sm">
      <img
        src={logo}
        alt={showName ? '' : 'Colibri'}
        width={size}
        height={size}
        className="object-contain"
        style={{ width: size, height: size }}
      />
      {showName && (
        <div className="flex flex-col">
          <span className="font-headline-sm text-headline-sm leading-none text-on-surface">
            Colibri
          </span>
          {tagline && (
            <span className="font-label-sm text-label-sm tracking-wide text-on-surface-variant">
              {tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
