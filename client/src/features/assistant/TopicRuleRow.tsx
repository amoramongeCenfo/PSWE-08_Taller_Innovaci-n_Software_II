import { Link } from 'react-router';
import { Icon } from '../../components/Icon';
import { SegmentedControl } from '../../components/ui';
import { cx } from '../../lib/cx';
import type { TopicNotice } from '../knowledge/readiness';
import { REPLY_MODE_OPTIONS, TOPICS } from './topics';
import type { ReplyMode, TopicId } from './types';

const ICON_TONE: Record<ReplyMode, string> = {
  auto: 'bg-secondary-fixed/40 text-on-secondary-fixed-variant',
  ask: 'bg-tertiary-fixed/60 text-on-tertiary-fixed-variant',
  never: 'bg-surface-container-high text-on-surface-variant',
};

interface TopicRuleRowProps {
  topic: TopicId;
  mode: ReplyMode;
  onChange: (topic: TopicId, mode: ReplyMode) => void;
  /** Aviso bajo la consulta (por ejemplo, falta información para contestar solo). */
  notice?: TopicNotice | null;
}

const NOTICE_TONE: Record<TopicNotice['tone'], string> = {
  warning: 'bg-tertiary-fixed/40 text-on-tertiary-fixed-variant',
  info: 'bg-surface-container-low text-on-surface-variant',
};

/** Una consulta común y cómo la atiende Colibri. El color del ícono refleja la opción elegida. */
export function TopicRuleRow({ topic, mode, onChange, notice }: TopicRuleRowProps) {
  const { title, description, icon } = TOPICS[topic];
  return (
    <li className="flex flex-col gap-space-sm rounded-2xl bg-surface-container-lowest p-space-md shadow-hairline">
      <div className="flex flex-col gap-space-md md:flex-row md:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-space-md">
          <span
            aria-hidden="true"
            className={cx(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors',
              ICON_TONE[mode],
            )}
          >
            <Icon name={icon} size={20} />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="font-body-lg text-body-lg font-semibold text-on-surface">{title}</span>
            <span className="font-body-md text-body-md text-on-surface-variant">{description}</span>
          </div>
        </div>
        <SegmentedControl
          label={title}
          options={REPLY_MODE_OPTIONS}
          value={mode}
          onChange={(value) => onChange(topic, value)}
          className="self-start md:self-center"
        />
      </div>
      {notice && (
        <p
          className={cx(
            'flex flex-wrap items-center gap-x-space-sm gap-y-1 rounded-xl px-space-sm py-1.5 font-body-sm text-body-sm',
            NOTICE_TONE[notice.tone],
          )}
        >
          <Icon name={notice.tone === 'warning' ? 'warning' : 'info'} size={16} />
          <span className="min-w-0 flex-1">{notice.text}</span>
          {notice.link && (
            <Link to={notice.link.to} className="font-semibold underline underline-offset-2">
              {notice.link.label}
            </Link>
          )}
        </p>
      )}
    </li>
  );
}
