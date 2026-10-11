import type { ChannelId } from '../messages/types';

/**
 * Contrato de datos de la pantalla de Alertas. Todavía no existe el servicio que detecta
 * comentarios delicados (etapa 5 de la hoja de ruta): los componentes reciben estos tipos y,
 * mientras no haya datos, la pantalla muestra avisos de "sin datos".
 */

export type RiskLevel = 'alto' | 'medio' | 'bajo';

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
  /** Encabezado, por ejemplo "Colibri preparó esta respuesta con tono conciliador". */
  title: string;
  text: string;
}

export interface ReputationAlert {
  id: string;
  channel: ChannelId;
  /** Dónde se publicó: grupo, publicación o página. */
  source: string;
  risk: RiskLevel;
  comment: AlertComment;
  /** Otros comentarios en la misma publicación. */
  thread: AlertComment[];
  suggestedReply: SuggestedReply | null;
  /** Enlace a la publicación original en la red. */
  postUrl: string | null;
}

/** Qué tan estricto es Colibri al marcar comentarios como riesgo. */
export type Sensitivity = 'grave' | 'normal' | 'todo';

export interface AlertSettings {
  sensitivity: Sensitivity;
  /** Palabras que generan una alerta inmediata. */
  keywords: string[];
  notifyByWhatsApp: boolean;
  /** Número que recibe el aviso; null si no hay uno registrado. */
  whatsAppNumber: string | null;
}

export type AlertsTab = 'nuevas' | 'historial';
