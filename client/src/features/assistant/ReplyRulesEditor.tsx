import type { TopicNotice } from '../knowledge/readiness';
import { TopicRuleRow } from './TopicRuleRow';
import { TOPIC_IDS, type AssistantSettingsInput, type ReplyMode, type TopicId } from './types';

interface ReplyRulesEditorProps {
  rules: AssistantSettingsInput['rules'];
  onChange: (topic: TopicId, mode: ReplyMode) => void;
  /** Aviso opcional por consulta (Mi negocio lo usa para la información que falta). */
  noticeFor?: (topic: TopicId, mode: ReplyMode) => TopicNotice | null;
}

/** Lista de consultas comunes con lo que Colibri hace en cada una. */
export function ReplyRulesEditor({ rules, onChange, noticeFor }: ReplyRulesEditorProps) {
  return (
    <ul className="flex flex-col gap-space-sm">
      {TOPIC_IDS.map((topic) => (
        <TopicRuleRow
          key={topic}
          topic={topic}
          mode={rules[topic]}
          onChange={onChange}
          notice={noticeFor?.(topic, rules[topic])}
        />
      ))}
    </ul>
  );
}
