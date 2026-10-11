import { apiRequest } from '../../lib/http';
import type { ChannelService } from './channelService';
import type { Channel } from './types';

export const httpChannelService: ChannelService = {
  list: () => apiRequest<Channel[]>('/channels'),
};
