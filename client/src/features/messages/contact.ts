import type { Conversation } from './types';

/** Número en formato legible: "50688887777" -> "+506 8888 7777". */
export function formatPhone(contactId: string): string {
  const digits = contactId.replace(/\D/g, '');
  const costaRica = /^506(\d{4})(\d{4})$/.exec(digits);
  if (costaRica) return `+506 ${costaRica[1]} ${costaRica[2]}`;
  return digits ? `+${digits}` : contactId;
}

/** Nombre a mostrar: el que dio la persona en el canal o, si no hay, su número (WhatsApp) o "N/A". */
export function getContactLabel(
  conversation: Pick<Conversation, 'contactName' | 'contactId' | 'channel'>,
) {
  const name = conversation.contactName?.trim();
  if (name) return name;
  return conversation.channel === 'whatsapp' ? formatPhone(conversation.contactId) : 'N/A';
}

/** Dato secundario bajo el nombre: el teléfono en WhatsApp. Otros canales no tienen uno. */
export function getContactDetail(
  conversation: Pick<Conversation, 'contactName' | 'contactId' | 'channel'>,
): string | null {
  const hasName = Boolean(conversation.contactName?.trim());
  return hasName && conversation.channel === 'whatsapp'
    ? formatPhone(conversation.contactId)
    : null;
}
