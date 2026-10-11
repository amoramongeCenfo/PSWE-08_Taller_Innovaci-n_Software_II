import { siInstagram, siMessenger, siWhatsapp, type SimpleIcon } from 'simple-icons';
import { Icon } from '../../components/Icon';
import { getChannelIcon } from '../dashboard/channelIcons';

/** Logos oficiales (paquete simple-icons, licencia CC0) de los canales que Colibri conecta. */
const LOGOS: Record<string, SimpleIcon> = {
  whatsapp: siWhatsapp,
  instagram: siInstagram,
  messenger: siMessenger,
};

const LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  messenger: 'Messenger',
};

interface ChannelLogoProps {
  /** Identificador del canal: "whatsapp", "instagram" o "messenger". */
  channel: string;
  /** Tamaño en px. Por defecto 16. */
  size?: number;
  className?: string;
}

/**
 * Logo del canal con su color de marca. Lleva un texto accesible con el nombre del canal, así que
 * puede reemplazar a la etiqueta escrita. Si el canal no tiene logo, usa un ícono genérico.
 */
export function ChannelLogo({ channel, size = 16, className = '' }: ChannelLogoProps) {
  const key = channel.trim().toLowerCase();
  const logo = LOGOS[key];
  const label = LABELS[key] ?? channel;

  if (!logo) {
    return (
      <span role="img" aria-label={label} className={className}>
        <Icon name={getChannelIcon(key)} size={size} />
      </span>
    );
  }

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={`#${logo.hex}`}
      className={`shrink-0 ${className}`}
    >
      <title>{label}</title>
      <path d={logo.path} />
    </svg>
  );
}
