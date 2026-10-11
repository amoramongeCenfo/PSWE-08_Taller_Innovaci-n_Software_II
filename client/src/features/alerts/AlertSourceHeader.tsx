import { ChannelLogo } from '../channels';
import { formatListTime } from '../messages';
import { getChannelLabel } from '../messages';
import { RiskBadge } from './RiskBadge';
import type { ReputationAlert } from './types';

/** Red, publicación de origen, cuándo y nivel de riesgo. */
export function AlertSourceHeader({ alert }: { alert: ReputationAlert }) {
  return (
    <header className="flex items-start justify-between gap-space-md">
      <div className="flex min-w-0 items-center gap-space-sm">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-container-low">
          <ChannelLogo channel={alert.channel} size={18} />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="font-label-md text-label-md font-semibold tracking-wide text-on-surface-variant uppercase">
            {getChannelLabel(alert.channel)}
          </span>
          <span className="truncate font-body-sm text-body-sm text-on-surface">
            {alert.source} · {formatListTime(alert.comment.postedAt)}
          </span>
        </div>
      </div>
      <RiskBadge level={alert.risk} />
    </header>
  );
}
