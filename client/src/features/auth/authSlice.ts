import { createAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { authService } from './authService';
import { AuthError, type AuthErrorCode } from './errors';
import { saveProfile } from '../profile/saveProfile';
import type { AuthStatus, LoginCredentials, Session, User } from './types';

export interface AuthState {
  status: AuthStatus;
  user: User | null;
}

const initialState: AuthState = { status: 'loading', user: null };
const signedOut: AuthState = { status: 'unauthenticated', user: null };

function authenticated(session: Session): AuthState {
  return { status: 'authenticated', user: session.user };
}

/** Comprueba si ya existe una sesión (por ejemplo, la cookie de una visita anterior). */
export const restoreSession = createAsyncThunk('auth/restoreSession', () =>
  authService.getSession(),
);

export const login = createAsyncThunk<Session, LoginCredentials, { rejectValue: AuthErrorCode }>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      return await authService.login(credentials);
    } catch (error) {
      return rejectWithValue(error instanceof AuthError ? error.code : 'UNKNOWN');
    }
  },
);

/** El servidor dijo que la sesión ya no es válida (por ejemplo, venció mientras se usaba la app). */
export const sessionExpired = createAction('auth/sessionExpired');

export const logout = createAsyncThunk('auth/logout', () => authService.logout());

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.fulfilled, (_state, { payload }) =>
        payload ? authenticated(payload) : signedOut,
      )
      .addCase(restoreSession.rejected, () => signedOut)
      .addCase(login.fulfilled, (_state, { payload }) => authenticated(payload))
      // Al guardar el perfil, el nombre y el puesto de la persona se actualizan aquí.
      .addCase(saveProfile.fulfilled, (state, { payload }) => {
        if (state.user) state.user = { ...state.user, ...payload.user };
      })
      .addCase(sessionExpired, () => signedOut)
      // Aunque el servicio falle al cerrar sesión, la interfaz queda como sin sesión.
      .addCase(logout.fulfilled, () => signedOut)
      .addCase(logout.rejected, () => signedOut);
  },
});

export const authReducer = authSlice.reducer;
