import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { logout, sessionExpired } from '../auth/authSlice';
import { saveAssistantSettings } from '../assistant/assistantSlice';
import { knowledgeService } from './knowledgeService';
import type { BusinessKnowledge, KnowledgeStatus, KnowledgeView } from './types';

export interface KnowledgeState {
  status: KnowledgeStatus;
  view: KnowledgeView | null;
}

const initialState: KnowledgeState = { status: 'idle', view: null };

/** Carga la información. Si ya está cargada o cargándose, no vuelve a pedirla (salvo `force`). */
export const fetchKnowledge = createAsyncThunk(
  'knowledge/fetch',
  (_options: { force?: boolean } | undefined) => knowledgeService.get(),
  {
    condition: (options, { getState }) => {
      const { knowledge } = getState() as { knowledge: KnowledgeState };
      if (knowledge.status === 'loading') return false;
      return Boolean(options?.force) || knowledge.status !== 'ready';
    },
  },
);

export const saveKnowledge = createAsyncThunk('knowledge/save', (knowledge: BusinessKnowledge) =>
  knowledgeService.save(knowledge),
);

const knowledgeSlice = createSlice({
  name: 'knowledge',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Al recargar se mantiene `view`: la pantalla sigue mostrando lo anterior mientras tanto.
      .addCase(fetchKnowledge.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchKnowledge.fulfilled, (state, { payload }) => {
        state.status = 'ready';
        state.view = payload;
      })
      .addCase(fetchKnowledge.rejected, (state) => {
        state.status = state.view ? 'ready' : 'error';
      })
      .addCase(saveKnowledge.fulfilled, (state, { payload }) => {
        state.status = 'ready';
        state.view = payload;
      })
      // El tono, el trato y la firma cambian las plantillas de fábrica: hay que volver a pedirlas.
      .addCase(saveAssistantSettings.fulfilled, (state) => {
        if (state.status === 'ready') state.status = 'idle';
      })
      .addCase(sessionExpired, () => initialState)
      .addCase(logout.fulfilled, () => initialState)
      .addCase(logout.rejected, () => initialState);
  },
});

export const knowledgeReducer = knowledgeSlice.reducer;
