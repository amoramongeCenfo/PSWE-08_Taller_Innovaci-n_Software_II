import type { TopicId } from '../assistant/types';
import type { MessageAnalysis, MessageAnalysisInput, MessageAnalyzer } from './messageAnalyzer';

/** Minúsculas, sin tildes y sin signos: "¿Dónde están?" → "donde estan". */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** Palabras clave por tema (ya normalizadas). Los reclamos van primero: siempre ganan. */
const KEYWORDS: [TopicId, string[]][] = [
  [
    'complaints',
    [
      'reclamo',
      'queja',
      'mal servicio',
      'pesimo',
      'estafa',
      'devolucion',
      'reembolso',
      'nunca llego',
      'llego danado',
      'molesto',
      'molesta',
    ],
  ],
  [
    'hours',
    [
      'horario',
      'hora abren',
      'a que hora',
      'que hora',
      'abren',
      'abierto',
      'abiertos',
      'cierran',
      'cerrado',
      'atienden',
    ],
  ],
  [
    'location',
    [
      'donde estan',
      'donde queda',
      'ubicacion',
      'ubicados',
      'direccion',
      'como llego',
      'waze',
      'google maps',
      'local',
    ],
  ],
  [
    'pricing',
    [
      'precio',
      'precios',
      'cuanto cuesta',
      'cuanto vale',
      'cuanto sale',
      'costo',
      'sinpe',
      'tarjeta',
      'formas de pago',
      'metodos de pago',
    ],
  ],
  [
    'availability',
    ['disponible', 'disponibilidad', 'tienen', 'hay stock', 'les queda', 'todavia hay', 'agotado'],
  ],
  [
    'shipping',
    [
      'envio',
      'envios',
      'envian',
      'mandan',
      'entrega',
      'a domicilio',
      'correos de costa rica',
      'express',
    ],
  ],
  ['orders', ['encargo', 'encargar', 'pedido', 'pedidos', 'por encargo', 'reservar', 'apartar']],
];

const contains = (haystack: string, needle: string) => ` ${haystack} `.includes(` ${needle} `);

/**
 * Analizador básico de ejemplo: busca palabras clave del español de Costa Rica. Sirve para probar
 * de punta a punta mientras el área de análisis termina el suyo; no pretende ser preciso.
 *
 * - Un solo tema reconocido: confianza 0.8 (0.9 con dos o más palabras clave).
 * - Varios temas a la vez: el de más coincidencias con confianza 0.5 (no alcanza para contestar solo).
 * - Los reclamos siempre ganan, para que nunca se contesten solos por error.
 */
export class BasicMessageAnalyzer implements MessageAnalyzer {
  async analyze({ text, blockedTopics }: MessageAnalysisInput): Promise<MessageAnalysis> {
    const clean = normalize(text);
    const blocked = blockedTopics.some((topic) => {
      const needle = normalize(topic);
      return needle.length > 0 && contains(clean, needle);
    });
    if (!clean) return { topic: null, confidence: 0, blocked };

    const matches = KEYWORDS.map(([topic, words]) => ({
      topic,
      hits: words.filter((word) => contains(clean, word)).length,
    })).filter(({ hits }) => hits > 0);

    if (matches.length === 0) return { topic: null, confidence: 0, blocked };
    const complaint = matches.find(({ topic }) => topic === 'complaints');
    if (complaint) return { topic: 'complaints', confidence: 0.9, blocked };

    const best = matches.reduce((a, b) => (b.hits > a.hits ? b : a));
    const confidence = matches.length > 1 ? 0.5 : best.hits > 1 ? 0.9 : 0.8;
    return { topic: best.topic, confidence, blocked };
  }
}
