export type ChannelState = 'active' | 'not_configured';

export interface Channel {
  id: string;
  name: string;
  state: ChannelState;
}

export type ChannelsStatus = 'idle' | 'loading' | 'ready' | 'error';
