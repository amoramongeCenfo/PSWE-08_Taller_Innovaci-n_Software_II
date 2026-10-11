import { httpChannelService } from './httpChannelService';
import type { Channel } from './types';

/**
 * Contrato para leer el estado de los canales conectados.
 *   list -> GET /api/channels   Devuelve Channel[]
 */
export interface ChannelService {
  list(): Promise<Channel[]>;
}

export const channelService: ChannelService = httpChannelService;
