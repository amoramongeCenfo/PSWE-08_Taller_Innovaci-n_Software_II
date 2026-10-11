import { Card } from '../../components/ui';
import { cx } from '../../lib/cx';
import { AlertActions } from './AlertActions';
import { AlertSourceHeader } from './AlertSourceHeader';
import { CommentQuote } from './CommentQuote';
import { RISK_STYLES } from './RiskBadge';
import { SuggestedReplyBox } from './SuggestedReplyBox';
import { ThreadReplies } from './ThreadReplies';
import type { ReputationAlert } from './types';

/**
 * Una alerta: el comentario delicado, la conversación alrededor, la respuesta sugerida y las
 * acciones. El borde izquierdo lleva el color del nivel de riesgo.
 */
export function AlertCard({ alert }: { alert: ReputationAlert }) {
  return (
    <Card
      className={cx(
        'flex flex-col gap-space-md border-l-4 p-space-lg md:p-space-lg',
        RISK_STYLES[alert.risk].border,
      )}
    >
      <AlertSourceHeader alert={alert} />
      <CommentQuote comment={alert.comment} />
      <ThreadReplies replies={alert.thread} />
      {alert.suggestedReply && <SuggestedReplyBox reply={alert.suggestedReply} />}
      <AlertActions postUrl={alert.postUrl} />
    </Card>
  );
}
