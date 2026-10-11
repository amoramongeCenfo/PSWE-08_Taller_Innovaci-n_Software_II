import type { AuthRepository } from '../auth/authRepository';
import type { AuthUser, UserProfile } from '../auth/types';
import type { BusinessRepository } from './businessRepository';
import type { Business, BusinessInput } from './types';

export interface ProfileInput {
  user: UserProfile;
  business: BusinessInput;
}

export interface SavedProfile {
  user: AuthUser;
  business: Business;
}

/** Guarda lo que se edita en la pantalla Perfil: la persona y su negocio. */
export class ProfileService {
  constructor(
    private readonly users: AuthRepository,
    private readonly business: BusinessRepository,
  ) {}

  getBusiness(): Promise<Business> {
    return this.business.get();
  }

  async save(userId: string, input: ProfileInput): Promise<SavedProfile> {
    const business = await this.business.save(input.business);
    const user = await this.users.updateUserProfile(userId, input.user);
    return { user, business };
  }
}
