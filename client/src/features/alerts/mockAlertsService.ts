import type { AlertsService } from './alertsService';
import type { AlertSettings, ReputationAlert } from './types';

const MOCK_SETTINGS: AlertSettings = {
  sensitivity: 'normal',
  keywords: ['estafa', 'mala atención', 'intoxicación', 'quebrada', 'no contestan'],
  notifyByWhatsApp: true,
  whatsAppNumber: '+506 8842-1920',
};

const MOCK_NUEVAS: ReputationAlert[] = [
  {
    id: 'alert-001',
    channel: 'messenger',
    source: 'Grupo "Vecinos de San José"',
    risk: 'alto',
    comment: {
      author: 'Karla Montero',
      detail: 'Cliente',
      text: 'Pésima atención ayer en el local, compré una taza para regalo y venía quebrada por dentro, nadie me responde los mensajes y siento que fue una estafa.',
      postedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    },
    thread: [],
    suggestedReply: {
      title: 'Colibri preparó esta respuesta con tono conciliador',
      text: '¡Hola doña Karla! Qué pena tan grande leer esto. En Café & Artesanías San José cuidamos cada detalle con cariño. Por favor permítanos reponerle de inmediato su taza hoy mismo sin costo y revisamos qué pasó con su mensaje. Ya le escribimos por privado para solucionarlo de una vez.',
    },
    postUrl: null,
  },
  {
    id: 'alert-002',
    channel: 'instagram',
    source: 'Publicación "Café de especialidad de Tarrazú"',
    risk: 'medio',
    comment: {
      author: 'Roberto Morales',
      handle: '@robert_cr',
      text: 'Dicen que el café es 100% puro pero me supo amargo y el paquete venía sin fecha de tueste, me parece mala atención no indicar eso.',
      postedAt: new Date(Date.now() - 19 * 60 * 60 * 1000).toISOString(),
    },
    thread: [
      {
        author: 'Laura Vega',
        handle: '@laurav_cr',
        text: 'A mí me pasó algo similar, la bolsa estaba mal sellada.',
        postedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
      },
      {
        author: 'Diego Cascante',
        handle: '@diegocr',
        text: '¿Será que cambiaron de proveedor?',
        postedAt: new Date(Date.now() - 17 * 60 * 60 * 1000).toISOString(),
      },
    ],
    suggestedReply: {
      title: 'Colibri preparó esta respuesta con tono informativo',
      text: 'Hola Roberto, gracias por tu comentario. Nuestro café Tarrazú se tuesta semanalmente; lamentamos que el empaque no lo indicara claramente. Te contactamos por privado para enviarte una bolsa de reposición.',
    },
    postUrl: null,
  },
];

const MOCK_HISTORIAL: ReputationAlert[] = [
  {
    id: 'alert-003',
    channel: 'messenger',
    source: 'Página principal',
    risk: 'medio',
    comment: {
      author: 'Ana Solano',
      text: 'Hice un pedido hace una semana y todavía no llega, nadie me responde.',
      postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    thread: [],
    suggestedReply: null,
    postUrl: null,
  },
];

let settings = { ...MOCK_SETTINGS };

/** Implementación local sin servidor; útil para desarrollo de la UI. */
export const mockAlertsService: AlertsService = {
  listNew: () => Promise.resolve(MOCK_NUEVAS),
  listHistory: () => Promise.resolve(MOCK_HISTORIAL),
  markAttended: () => Promise.resolve(),
  getSettings: () => Promise.resolve({ ...settings }),
  saveSettings: (patch) => {
    settings = { ...settings, ...patch };
    return Promise.resolve({ ...settings });
  },
};
