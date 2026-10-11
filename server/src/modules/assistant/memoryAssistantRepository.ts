import type { AssistantRepository } from './assistantRepository';
import { DEFAULT_SETTINGS, type AssistantSettings, type AssistantSettingsInput } from './types';

const copy = (settings: AssistantSettings): AssistantSettings => ({
  ...settings,
  rules: { ...settings.rules },
  blockedTopics: [...settings.blockedTopics],
});

export class MemoryAssistantRepository implements AssistantRepository {
  private settings: AssistantSettings = copy(DEFAULT_SETTINGS);

  async get() {
    return copy(this.settings);
  }

  async save(input: AssistantSettingsInput, completedAt: string | null) {
    this.settings = copy({
      ...input,
      onboardingCompletedAt: this.settings.onboardingCompletedAt ?? completedAt,
    });
    return copy(this.settings);
  }

  async resetOnboarding() {
    this.settings.onboardingCompletedAt = null;
  }

  async clear() {
    this.settings = copy(DEFAULT_SETTINGS);
  }
}
