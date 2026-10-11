import { createAsyncThunk } from '@reduxjs/toolkit';
import { profileService } from './profileService';
import type { ProfileData } from './types';

/**
 * Acción única para guardar el perfil. Las áreas que usan estos datos (auth y business)
 * escuchan su resultado en su propio slice, así el store se actualiza una sola vez y
 * toda la interfaz queda al día.
 */
export const saveProfile = createAsyncThunk('profile/save', (data: ProfileData) =>
  profileService.save(data),
);
