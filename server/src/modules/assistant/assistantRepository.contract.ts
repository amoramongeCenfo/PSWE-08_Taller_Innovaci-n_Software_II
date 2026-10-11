import { beforeEach, describe, expect, it } from 'vitest';
import type { AssistantRepository } from './assistantRepository';
import { DEFAULT_SETTINGS, type AssistantSettingsInput } from './types';

/** Pruebas que TODA implementación de AssistantRepository debe pasar. */
export function describeAssistantRepository(
  name: string,
  create: () => Promise<AssistantRepository>,
): void {
  describe(name, () => {
    let repo: AssistantRepository;

    beforeEach(async () => {
      repo = await create();
    });

    const input: AssistantSettingsInput = {
      rules: { ...DEFAULT_SETTINGS.rules, availability: 'auto', complaints: 'never' },
      blockedTopics: ['Tratamientos médicos', 'Descuentos por mayor'],
      tone: 'profesional',
      treatment: 'vos',
      signature: 'Equipo Pura Vida',
      autoReplyPaused: true,
    };

    it('devuelve los valores iniciales mientras no se haya guardado nada', async () => {
      expect(await repo.get()).toEqual(DEFAULT_SETTINGS);
    });

    it('guarda los ajustes sin completar la bienvenida', async () => {
      const saved = await repo.save(input, null);
      expect(saved).toEqual({ ...input, onboardingCompletedAt: null });
      expect(await repo.get()).toEqual(saved);
    });

    it('marca la bienvenida como completa y conserva la primera fecha', async () => {
      const first = await repo.save(input, '2026-10-11T10:00:00.000Z');
      expect(first.onboardingCompletedAt).toBe('2026-10-11T10:00:00.000Z');

      const again = await repo.save({ ...input, tone: 'breve' }, '2026-10-12T10:00:00.000Z');
      expect(again.onboardingCompletedAt).toBe('2026-10-11T10:00:00.000Z');
      expect(again.tone).toBe('breve');

      const edited = await repo.save({ ...input, signature: null, blockedTopics: [] }, null);
      expect(edited).toMatchObject({
        signature: null,
        blockedTopics: [],
        onboardingCompletedAt: '2026-10-11T10:00:00.000Z',
      });
    });

    it('vuelve a mostrar la bienvenida sin perder los ajustes', async () => {
      await repo.save(input, '2026-10-11T10:00:00.000Z');
      await repo.resetOnboarding();
      expect(await repo.get()).toEqual({ ...input, onboardingCompletedAt: null });

      const again = await repo.save(input, '2026-10-13T10:00:00.000Z');
      expect(again.onboardingCompletedAt).toBe('2026-10-13T10:00:00.000Z');
    });

    it('borra todo y vuelve a los valores iniciales', async () => {
      await repo.save(input, '2026-10-11T10:00:00.000Z');
      await repo.clear();
      expect(await repo.get()).toEqual(DEFAULT_SETTINGS);
    });

    it('no comparte objetos con quien lo usa', async () => {
      const saved = await repo.save(input, null);
      saved.blockedTopics.push('otro');
      saved.rules.hours = 'never';
      expect(await repo.get()).toMatchObject({ blockedTopics: input.blockedTopics });
      expect((await repo.get()).rules.hours).toBe('auto');
    });
  });
}
