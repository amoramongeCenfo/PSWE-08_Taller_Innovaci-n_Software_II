import type { ChannelId, Conversation } from './types';

/** La persona escribió y todavía no le hemos respondido. */
export function isAwaitingReply(conversation: Pick<Conversation, 'awaitingSince'>): boolean {
  return conversation.awaitingSince !== null;
}

const CHANNEL_LABELS: Record<ChannelId, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  messenger: 'Messenger',
};

/** Largo máximo de una respuesta de texto en cada canal. */
const MAX_REPLY_LENGTH: Record<ChannelId, number> = {
  whatsapp: 4096,
  instagram: 1000,
  messenger: 2000,
};

export function getMaxReplyLength(channel: ChannelId): number {
  return MAX_REPLY_LENGTH[channel];
}

/** Nombre de un canal para mostrar en pantalla. */
export function getChannelLabel(channel: ChannelId): string {
  return CHANNEL_LABELS[channel];
}
