import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { logout, sessionExpired } from '../auth/authSlice';
import { assistantService } from './assistantService';
import type { AssistantSettings, AssistantSettingsInput, AssistantStatus } from './types';

export interface AssistantState {
  status: AssistantStatus;
  settings: AssistantSettings | null;
}

const initialState: AssistantState = { status: 'idle', settings: null };

/** Carga los ajustes. Si ya están cargados o cargándose, no vuelve a pedirlos. */
export const fetchAssistantSettings = createAsyncThunk(
  'assistant/fetch',
  () => assistantService.get(),
  {
    condition: (_arg, { getState }) => {
      const { assistant } = getState() as { assistant: AssistantState };
      return assistant.status === 'idle' || assistant.status === 'error';
    },
  },
);

interface SaveArgs {
  input: AssistantSettingsInput;
  /** true al terminar la bienvenida. */
  completeOnboarding?: boolean;
}

export const saveAssistantSettings = createAsyncThunk(
  'assistant/save',
  ({ input, completeOnboarding = false }: SaveArgs) =>
    assistantService.save(input, completeOnboarding),
);

const assistantSlice = createSlice({
  name: 'assistant',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssistantSettings.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAssistantSettings.fulfilled, (state, { payload }) => {
        state.status = 'ready';
        state.settings = payload;
      })
      .addCase(fetchAssistantSettings.rejected, (state) => {
        state.status = 'error';
      })
      .addCase(saveAssistantSettings.fulfilled, (state, { payload }) => {
        state.status = 'ready';
        state.settings = payload;
      })
      .addCase(sessionExpired, () => initialState)
      .addCase(logout.fulfilled, () => initialState)
      .addCase(logout.rejected, () => initialState);
  },
});

export const assistantReducer = assistantSlice.reducer;
