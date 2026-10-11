import { beforeEach, describe, expect, it } from 'vitest';
import type { KnowledgeRepository } from './knowledgeRepository';
import { EMPTY_KNOWLEDGE, type BusinessKnowledge } from './types';

export const SAMPLE_KNOWLEDGE: BusinessKnowledge = {
  hours: {
    days: {
      mon: { open: '08:00', close: '18:00' },
      tue: { open: '08:00', close: '18:00' },
      wed: { open: '08:00', close: '18:00' },
      thu: { open: '08:00', close: '18:00' },
      fri: { open: '08:00', close: '18:00' },
      sat: { open: '09:00', close: '13:00' },
      sun: 'closed',
    },
    notes: 'Los feriados abrimos de 9 a. m. a 1 p. m.',
  },
  location: {
    address: 'Barrio Escalante, San José',
    landmarks: '100 m norte de la iglesia Santa Teresita',
    mapsUrl: 'https://waze.com/ul/abc',
  },
  payments: {
    methods: 'efectivo, tarjeta y SINPE Móvil',
    sinpeNumber: '88887777',
    sinpeName: 'Café Pura Vida',
    prices: 'El café de 340 g cuesta ₡6.500 y las tazas desde ₡8.000.',
  },
  shipping: 'Enviamos por Correos de Costa Rica a todo el país (₡3.000).',
  availability: null,
  orders: null,
  templates: { location: '{saludo} Estamos en {direccion}. {firma}' },
};

/** Pruebas que TODA implementación de KnowledgeRepository debe pasar. */
export function describeKnowledgeRepository(
  name: string,
  create: () => Promise<KnowledgeRepository>,
): void {
  describe(name, () => {
    let repo: KnowledgeRepository;

    beforeEach(async () => {
      repo = await create();
    });

    it('empieza vacío', async () => {
      expect(await repo.get()).toEqual(EMPTY_KNOWLEDGE);
    });

    it('guarda y devuelve la información completa', async () => {
      expect(await repo.save(SAMPLE_KNOWLEDGE)).toEqual(SAMPLE_KNOWLEDGE);
      expect(await repo.get()).toEqual(SAMPLE_KNOWLEDGE);
    });

    it('no comparte objetos con quien lo usa', async () => {
      const saved = await repo.save(SAMPLE_KNOWLEDGE);
      saved.hours.days.mon = 'closed';
      saved.templates.hours = 'otra';
      const again = await repo.get();
      expect(again.hours.days.mon).toEqual({ open: '08:00', close: '18:00' });
      expect(again.templates.hours).toBeUndefined();
    });
  });
}
