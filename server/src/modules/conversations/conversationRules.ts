import type { MessageAuthor, MessageDirection, MessageStatus, NewMessage } from './types';

const PREVIEW_LENGTH = 80;

/** Orden en que avanza un mensaje enviado: un estado nunca retrocede (p. ej. "leído" -> "enviado"). */
export const STATUS_RANK: Record<MessageStatus, number> = {
  received: 0,
  failed: 0,
  sent: 1,
  delivered: 2,
  read: 3,
};

/** Texto corto del último mensaje, para la lista de conversaciones. */
export function previewOf(message: Pick<NewMessage, 'text'>): string {
  const text = message.text ?? 'Mensaje no soportado';
  return text.length > PREVIEW_LENGTH ? `${text.slice(0, PREVIEW_LENGTH)}…` : text;
}

/** ¿Debe aplicarse el nuevo estado? "failed" siempre; los demás solo si avanzan. */
export function shouldApplyStatus(current: MessageStatus, next: MessageStatus): boolean {
  return next === 'failed' || STATUS_RANK[next] > STATUS_RANK[current];
}

/** Autor por defecto: el cliente escribe lo recibido; una persona del negocio lo enviado. */
export function defaultAuthor(direction: MessageDirection): MessageAuthor {
  return direction === 'inbound' ? 'customer' : 'person';
}
