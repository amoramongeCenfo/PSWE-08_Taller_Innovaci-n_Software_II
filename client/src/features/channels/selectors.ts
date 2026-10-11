import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../store';

const selectChannels = (state: RootState) => state.channels.items;

/** Nombres de los canales que ya están funcionando, por ejemplo ["WhatsApp"]. */
export const selectActiveChannelNames = createSelector([selectChannels], (channels) =>
  channels.filter((channel) => channel.state === 'active').map((channel) => channel.name),
);

/** Canales que ya están funcionando, con su id (para mostrar su logo). */
export const selectActiveChannels = createSelector([selectChannels], (channels) =>
  channels.filter((channel) => channel.state === 'active'),
);
