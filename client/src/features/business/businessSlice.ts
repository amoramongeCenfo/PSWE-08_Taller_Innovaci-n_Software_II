import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { logout, sessionExpired } from '../auth/authSlice';
import { businessService } from './businessService';
import { saveProfile } from '../profile/saveProfile';
import { EMPTY_BUSINESS_PROFILE, type BusinessProfile, type BusinessStatus } from './types';

export interface BusinessState {
  status: BusinessStatus;
  profile: BusinessProfile | null;
}

const initialState: BusinessState = { status: 'idle', profile: null };

interface FetchOptions {
  /** Vuelve a pedir los datos aunque ya estén cargados (por ejemplo, el botón de actualizar). */
  force?: boolean;
}

/** Carga los datos del negocio. Si ya están cargados o cargándose, no vuelve a pedirlos. */
export const fetchBusinessProfile = createAsyncThunk(
  'business/fetchProfile',
  (_options: FetchOptions | void) => businessService.getProfile(),
  {
    condition: (options, { getState }) => {
      const { business } = getState() as { business: BusinessState };
      if (business.status === 'loading') return false;
      return Boolean(options?.force) || business.status === 'idle' || business.status === 'error';
    },
  },
);

const businessSlice = createSlice({
  name: 'business',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBusinessProfile.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchBusinessProfile.fulfilled, (state, { payload }) => {
        state.status = 'ready';
        state.profile = payload;
      })
      .addCase(fetchBusinessProfile.rejected, (state) => {
        state.status = 'error';
      })
      // Al guardar el perfil, el nombre y la dirección del negocio se actualizan aquí.
      .addCase(saveProfile.fulfilled, (state, { payload }) => {
        state.status = 'ready';
        state.profile = { ...(state.profile ?? EMPTY_BUSINESS_PROFILE), ...payload.business };
      })
      // Al cerrar sesión se borran los datos del negocio.
      .addCase(sessionExpired, () => initialState)
      .addCase(logout.fulfilled, () => initialState)
      .addCase(logout.rejected, () => initialState);
  },
});

export const businessReducer = businessSlice.reducer;
