import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { logout, sessionExpired } from '../auth/authSlice';
import { channelService } from './channelService';
import type { Channel, ChannelsStatus } from './types';

export interface ChannelsState {
  status: ChannelsStatus;
  items: Channel[];
}

const initialState: ChannelsState = { status: 'idle', items: [] };

/** Carga el estado de los canales. Si ya se está cargando, no repite la llamada. */
export const fetchChannels = createAsyncThunk('channels/fetch', () => channelService.list(), {
  condition: (_arg, { getState }) => {
    const { channels } = getState() as { channels: ChannelsState };
    return channels.status !== 'loading';
  },
});

const channelsSlice = createSlice({
  name: 'channels',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchChannels.pending, (state) => {
        if (state.status !== 'ready') state.status = 'loading';
      })
      .addCase(fetchChannels.fulfilled, (state, { payload }) => {
        state.status = 'ready';
        state.items = payload;
      })
      .addCase(fetchChannels.rejected, (state) => {
        // Si ya teníamos datos, se conservan hasta la siguiente actualización.
        if (state.items.length === 0) state.status = 'error';
      })
      .addCase(sessionExpired, () => initialState)
      .addCase(logout.fulfilled, () => initialState)
      .addCase(logout.rejected, () => initialState);
  },
});

export const channelsReducer = channelsSlice.reducer;
