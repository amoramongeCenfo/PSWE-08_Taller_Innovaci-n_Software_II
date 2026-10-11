import {
  ChannelStatusCard,
  QuickActions,
  RecentActivity,
  ReputationCard,
  StatsOverview,
  WelcomeHeader,
  useResponseTime,
} from '../features/dashboard';
import { useConversationsPolling } from '../features/messages';

const REFRESH_INTERVAL_MS = 15_000;

export function InicioPage() {
  // Los indicadores y la actividad reciente leen las mismas conversaciones.
  useConversationsPolling(REFRESH_INTERVAL_MS);
  const responseStats = useResponseTime();

  return (
    <div className="flex flex-col gap-space-xl">
      <WelcomeHeader />
      <ChannelStatusCard />
      <StatsOverview stats={responseStats} />
      <div className="grid grid-cols-1 gap-space-md xl:grid-cols-3">
        <RecentActivity />
        <div className="flex flex-col gap-space-md">
          <ReputationCard stats={responseStats} />
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
