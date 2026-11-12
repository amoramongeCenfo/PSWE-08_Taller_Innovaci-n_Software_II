import type { ChannelId } from '../conversations/types';
import type { CommentRisk } from './commentAnalyzer';

/**
 * Tipos de la pantalla de Alertas (etapa 5). El servidor devuelve estos objetos tal cual los
 * consume el cliente (client/src/features/alerts/types.ts).
 */

export type AlertStatus = 'nueva' | 'atendida';

export interface AlertComment {
  author: string;
  /** Usuario en la red, por ejemplo "@robert_cr". */
  handle?: string;
  /** Detalle corto del autor, por ejemplo "Cliente". */
  detail?: string;
  text: string;
  postedAt: string;
}

export interface SuggestedReply {
  title: string;
  text: string;
}

export interface ReputationAlert {
  id: string;
  channel: ChannelId;
  /** Dónde se publicó: grupo, publicación o página. */
  source: string;
  risk: CommentRisk;
  status: AlertStatus;
  comment: AlertComment;
  /** Otros comentarios en la misma publicación. */
  thread: AlertComment[];
  suggestedReply: SuggestedReply | null;
  /** Enlace a la publicación original en la red. */
  postUrl: string | null;
  /** Cuándo Colibri detectó la alerta (ISO 8601). */
  detectedAt: string;
}

/** Alerta sin los campos que asigna el repositorio (id, estado y fecha por defecto). */
export type NewAlert = Omit<ReputationAlert, 'id' | 'status' | 'detectedAt'> & {
  status?: AlertStatus;
  detectedAt?: string;
};

export type Sensitivity = 'grave' | 'normal' | 'todo';

export interface AlertSettings {
  sensitivity: Sensitivity;
  /** Palabras que generan una alerta inmediata. */
  keywords: string[];
  notifyByWhatsApp: boolean;
  /** Número que recibe el aviso; null si no hay uno registrado. */
  whatsAppNumber: string | null;
}

export const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  sensitivity: 'normal',
  keywords: ['estafa', 'mala atención', 'intoxicación', 'quebrada', 'no contestan'],
  notifyByWhatsApp: true,
  whatsAppNumber: null,
};
