const CHANNEL_ICONS: Record<string, string> = {
  whatsapp: 'chat',
  instagram: 'photo_camera',
  facebook: 'public',
  messenger: 'forum',
};

/** Ícono de Material Symbols para un canal. Si no lo conoce, usa uno genérico. */
export function getChannelIcon(channel: string): string {
  return CHANNEL_ICONS[channel.trim().toLowerCase()] ?? 'forum';
}
