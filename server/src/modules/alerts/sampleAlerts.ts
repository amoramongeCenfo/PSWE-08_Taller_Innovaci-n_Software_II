import type { AlertSettings, NewAlert } from './types';

/**
 * Conjunto de datos de ejemplo para alertas de reputación. Lo usan:
 *  - el script `alerts:seed` para inyectar la base de datos (PostgreSQL), y
 *  - el almacenamiento en memoria, para que la pantalla muestre datos sin configurar PostgreSQL.
 *
 * No son datos reales: ilustran los tres niveles de riesgo y los distintos canales.
 */

/** Fechas relativas al momento en que se ejecuta el seed, para que "hace X minutos" tenga sentido. */
const minutesAgo = (n: number) => new Date(Date.now() - n * 60 * 1000).toISOString();
const hoursAgo = (n: number) => new Date(Date.now() - n * 60 * 60 * 1000).toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

export const SAMPLE_ALERTS: NewAlert[] = [
  {
    channel: 'messenger',
    source: 'Grupo "Vecinos de San José"',
    risk: 'alto',
    status: 'nueva',
    detectedAt: minutesAgo(25),
    comment: {
      author: 'Karla Montero',
      detail: 'Cliente',
      text: 'Pésima atención ayer en el local, compré una taza para regalo y venía quebrada por dentro, nadie me responde los mensajes y siento que fue una estafa.',
      postedAt: minutesAgo(25),
    },
    thread: [],
    suggestedReply: {
      title: 'Colibri preparó esta respuesta con tono conciliador',
      text: '¡Hola doña Karla! Qué pena tan grande leer esto. En Café & Artesanías San José cuidamos cada detalle con cariño. Por favor permítanos reponerle de inmediato su taza hoy mismo sin costo y revisamos qué pasó con su mensaje. Ya le escribimos por privado para solucionarlo de una vez.',
    },
    postUrl: null,
  },
  {
    channel: 'instagram',
    source: 'Publicación "Café de especialidad de Tarrazú"',
    risk: 'medio',
    status: 'nueva',
    detectedAt: hoursAgo(19),
    comment: {
      author: 'Roberto Morales',
      handle: '@robert_cr',
      text: 'Dicen que el café es 100% puro pero me supo amargo y el paquete venía sin fecha de tueste, me parece mala atención no indicar eso.',
      postedAt: hoursAgo(19),
    },
    thread: [
      {
        author: 'Laura Vega',
        handle: '@laurav_cr',
        text: 'A mí me pasó algo similar, la bolsa estaba mal sellada.',
        postedAt: hoursAgo(18),
      },
      {
        author: 'Diego Cascante',
        handle: '@diegocr',
        text: '¿Será que cambiaron de proveedor?',
        postedAt: hoursAgo(17),
      },
    ],
    suggestedReply: {
      title: 'Colibri preparó esta respuesta con tono informativo',
      text: 'Hola Roberto, gracias por tu comentario. Nuestro café Tarrazú se tuesta semanalmente; lamentamos que el empaque no lo indicara claramente. Te contactamos por privado para enviarte una bolsa de reposición.',
    },
    postUrl: null,
  },
  {
    channel: 'whatsapp',
    source: 'Mensaje directo',
    risk: 'bajo',
    status: 'nueva',
    detectedAt: hoursAgo(5),
    comment: {
      author: 'Sofía Rodríguez',
      detail: 'Cliente',
      text: 'Hola, hice un pedido y todavía no me responden, ¿lo pueden revisar?',
      postedAt: hoursAgo(5),
    },
    thread: [],
    suggestedReply: null,
    postUrl: null,
  },
  {
    channel: 'messenger',
    source: 'Página principal',
    risk: 'medio',
    status: 'atendida',
    detectedAt: daysAgo(3),
    comment: {
      author: 'Ana Solano',
      text: 'Hice un pedido hace una semana y todavía no llega, nadie me responde.',
      postedAt: daysAgo(3),
    },
    thread: [],
    suggestedReply: null,
    postUrl: null,
  },
  {
    channel: 'instagram',
    source: 'Comentario en reel "Nuevos diseños"',
    risk: 'alto',
    status: 'atendida',
    detectedAt: daysAgo(6),
    comment: {
      author: 'Marco Jiménez',
      handle: '@marcoj_cr',
      text: 'Me llegó el producto roto y cuando reclamé me bloquearon, esto es una estafa.',
      postedAt: daysAgo(6),
    },
    thread: [],
    suggestedReply: {
      title: 'Colibri preparó esta respuesta con tono conciliador',
      text: 'Hola Marco, lamentamos muchísimo lo ocurrido. No fue nuestra intención bloquearte. Te escribimos por privado para reponerte el producto y resolver esto hoy mismo.',
    },
    postUrl: null,
  },
];

export const SAMPLE_SETTINGS: AlertSettings = {
  sensitivity: 'normal',
  keywords: ['estafa', 'mala atención', 'intoxicación', 'quebrada', 'no contestan'],
  notifyByWhatsApp: true,
  whatsAppNumber: '+506 8842-1920',
};
