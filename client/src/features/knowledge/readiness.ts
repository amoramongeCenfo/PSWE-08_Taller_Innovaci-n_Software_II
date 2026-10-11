import type { ReplyMode, TopicId } from '../assistant/types';
import { AUTO_TOPICS, type AutoTopic, type KnowledgeView } from './types';

export interface TopicNotice {
  tone: 'warning' | 'info';
  text: string;
  /** Enlace a la información que falta. */
  link?: { label: string; to: string };
}

const isAutoTopic = (topic: TopicId): topic is AutoTopic =>
  (AUTO_TOPICS as readonly string[]).includes(topic);

/**
 * Aviso para una consulta en "Qué contesta Colibri": los reclamos nunca se contestan solos y una
 * consulta en "Contesta solo" sin la información necesaria tampoco.
 */
export function topicNotice(
  topic: TopicId,
  mode: ReplyMode,
  view: KnowledgeView | null,
): TopicNotice | null {
  if (mode !== 'auto') return null;
  if (!isAutoTopic(topic)) {
    return {
      tone: 'info',
      text: 'Los reclamos nunca se contestan solos: Colibri te avisará para que los atiendas tú.',
    };
  }
  if (view && !view.topics[topic].preview.ready) {
    return {
      tone: 'warning',
      text: 'Colibri no podrá contestar solo hasta que completes esta información.',
      link: { label: 'Completar', to: `#sabe-${topic}` },
    };
  }
  return null;
}
