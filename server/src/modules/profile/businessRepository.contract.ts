import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessRepository } from './businessRepository';

/** Pruebas que TODA implementación de BusinessRepository debe pasar. */
export function describeBusinessRepository(
  name: string,
  create: () => Promise<BusinessRepository>,
): void {
  describe(name, () => {
    let repo: BusinessRepository;

    beforeEach(async () => {
      repo = await create();
    });

    it('devuelve todo en null mientras no se haya guardado nada', async () => {
      expect(await repo.get()).toEqual({ name: null, region: null, address: null });
    });

    it('guarda y devuelve nombre y dirección', async () => {
      const saved = await repo.save({ name: 'Café Pura Vida', address: 'San José' });
      expect(saved).toEqual({ name: 'Café Pura Vida', region: null, address: 'San José' });
      expect(await repo.get()).toEqual(saved);
    });

    it('permite dejar la dirección vacía y volver a guardar', async () => {
      await repo.save({ name: 'Café Pura Vida', address: 'San José' });
      const saved = await repo.save({ name: 'Café Nuevo', address: null });
      expect(saved).toEqual({ name: 'Café Nuevo', region: null, address: null });
      expect(await repo.get()).toEqual(saved);
    });
  });
}
