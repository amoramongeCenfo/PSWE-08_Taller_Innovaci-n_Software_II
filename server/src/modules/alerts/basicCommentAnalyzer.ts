import { normalize } from '../autoreply/basicMessageAnalyzer';
import type {
  CommentAnalysis,
  CommentAnalysisInput,
  CommentAnalyzer,
  CommentCategory,
  CommentRisk,
} from './commentAnalyzer';

/**
 * Analizador básico de comentarios públicos: detecta señales de riesgo reputacional mediante
 * palabras clave del español de Costa Rica. Sirve como implementación de referencia mientras el
 * área de análisis entrega una versión más precisa.
 *
 * Lógica:
 * - Riesgo alto  : acusación de estafa o daño a la salud.
 * - Riesgo medio : queja de calidad o de falta de atención.
 * - Riesgo bajo  : ningún grupo coincide (confianza = 0).
 * - Palabras clave del negocio: se tratan como riesgo medio mínimo sin importar el grupo.
 * - Sensibilidad 'grave': solo evalúa grupos de riesgo alto; ignora los de riesgo medio.
 * - Sensibilidad 'todo': evalúa los grupos medios e incluye señales de una sola palabra leve.
 */

interface RiskGroup {
  risk: CommentRisk;
  category: CommentCategory;
  /** Frases y palabras ya normalizadas. */
  keywords: string[];
}

const RISK_GROUPS: RiskGroup[] = [
  {
    risk: 'alto',
    category: 'estafa',
    keywords: [
      'estafa',
      'fraude',
      'me robaron',
      'nos robaron',
      'ladrones',
      'timo',
      'engano',
      'enganos',
      'denuncia',
      'boicot',
      'boicotear',
      'oisam',
      'mecodecr',
    ],
  },
  {
    risk: 'alto',
    category: 'salud',
    keywords: [
      'intoxicacion',
      'intoxicado',
      'intoxicada',
      'intoxicados',
      'envenenamiento',
      'envenenado',
      'me enfermo',
      'nos enfermamos',
      'salmonela',
      'bacteria',
      'dano fisico',
      'quemadura',
    ],
  },
  {
    risk: 'medio',
    category: 'calidad',
    keywords: [
      'quebrado',
      'quebrada',
      'roto',
      'rota',
      'danado',
      'danada',
      'pesimo',
      'pesima',
      'defectuoso',
      'defectuosa',
      'mala calidad',
      'no sirve',
      'no funciona',
      'vencido',
      'vencida',
      'caduco',
      'caduca',
    ],
  },
  {
    risk: 'medio',
    category: 'atencion',
    keywords: [
      'mala atencion',
      'no contestan',
      'no responden',
      'no me responden',
      'no nos responden',
      'ignoran',
      'mal trato',
      'grosero',
      'grosera',
      'mal servicio',
      'nunca responden',
      'horas esperando',
      'nadie responde',
    ],
  },
];

/** Grupo adicional solo activo con sensibilidad 'todo': señales leves. */
const LEVE_GROUP: RiskGroup = {
  risk: 'bajo',
  category: 'atencion',
  keywords: [
    'no responde',
    'no me responde',
    'no me respondieron',
    'no respondieron',
    'no contestaron',
    'no me contestaron',
    'tarda mucho',
    'demora',
    'mala experiencia',
    'no recomiendo',
  ],
};

const contains = (haystack: string, needle: string) =>
  haystack === needle ||
  haystack.startsWith(`${needle} `) ||
  haystack.endsWith(` ${needle}`) ||
  haystack.includes(` ${needle} `);

export class BasicCommentAnalyzer implements CommentAnalyzer {
  async analyze({ text, keywords, sensitivity }: CommentAnalysisInput): Promise<CommentAnalysis> {
    const clean = normalize(text);

    if (!clean) {
      return { risk: 'bajo', confidence: 0, triggers: [], category: 'otro' };
    }

    const triggered: string[] = [];
    let bestRisk: CommentRisk = 'bajo';
    let bestCategory: CommentCategory = 'otro';
    let totalHits = 0;

    // Palabras clave configuradas por el negocio — siempre activas, riesgo mínimo 'medio'.
    for (const kw of keywords) {
      const needle = normalize(kw);
      if (needle.length > 0 && contains(clean, needle)) {
        triggered.push(kw);
        if (bestRisk === 'bajo') {
          bestRisk = 'medio';
          bestCategory = 'otro';
        }
        totalHits++;
      }
    }

    // Grupos predefinidos.
    const groups: RiskGroup[] = sensitivity === 'todo' ? [...RISK_GROUPS, LEVE_GROUP] : RISK_GROUPS;

    for (const group of groups) {
      if (sensitivity === 'grave' && group.risk !== 'alto') continue;

      for (const kw of group.keywords) {
        if (contains(clean, kw)) {
          triggered.push(kw);
          totalHits++;
          if (
            group.risk === 'alto' ||
            (group.risk === 'medio' && bestRisk !== 'alto') ||
            (group.risk === 'bajo' && bestRisk === 'bajo')
          ) {
            bestRisk = group.risk;
            bestCategory = group.category;
          }
        }
      }
    }

    if (totalHits === 0) {
      return { risk: 'bajo', confidence: 0, triggers: [], category: 'otro' };
    }

    // Con sensibilidad 'grave' y solo señales leves, no se reporta ningún riesgo.
    if (sensitivity === 'grave' && bestRisk !== 'alto') {
      return { risk: 'bajo', confidence: 0, triggers: [], category: 'otro' };
    }

    const confidence = Math.min(0.6 + totalHits * 0.15, 1);
    return {
      risk: bestRisk,
      confidence: Math.round(confidence * 100) / 100,
      triggers: [...new Set(triggered)],
      category: bestCategory,
    };
  }
}
