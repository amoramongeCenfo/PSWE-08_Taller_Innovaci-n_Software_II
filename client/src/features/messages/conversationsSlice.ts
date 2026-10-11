import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { logout, sessionExpired } from '../auth/authSlice';
import { messageService } from './messageService';
import type { Conversation, LoadStatus } from './types';

export interface ConversationsState {
  status: LoadStatus;
  items: Conversation[];
  /** La última actualización falló (se siguen mostrando los datos anteriores). */
  syncFailed: boolean;
}

const initialState: ConversationsState = { status: 'idle', items: [], syncFailed: false };

function newestFirst(a: Conversation, b: Conversation): number {
  return Date.parse(b.lastMessageAt) - Date.parse(a.lastMessageAt);
}

/**
 * Carga la lista de conversaciones. Se llama al entrar a la pantalla y cada pocos segundos;
 * las recargas no muestran el indicador de carga, solo la primera vez.
 */
export const fetchConversations = createAsyncThunk('conversations/fetch', () =>
  messageService.listConversations(),
);

const conversationsSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        if (state.status !== 'ready') state.status = 'loading';
      })
      .addCase(fetchConversations.fulfilled, (state, { payload }) => {
        state.status = 'ready';
        state.syncFailed = false;
        state.items = [...payload].sort(newestFirst);
      })
      .addCase(fetchConversations.rejected, (state) => {
        // Si ya había datos, se conservan: un fallo puntual no debe vaciar la bandeja.
        if (state.status !== 'ready') state.status = 'error';
        state.syncFailed = true;
      })
      .addCase(sessionExpired, () => initialState)
      .addCase(logout.fulfilled, () => initialState)
      .addCase(logout.rejected, () => initialState);
  },
});

export const conversationsReducer = conversationsSlice.reducer;
