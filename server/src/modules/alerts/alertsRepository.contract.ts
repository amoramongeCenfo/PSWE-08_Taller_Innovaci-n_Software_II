import { beforeEach, describe, expect, it } from 'vitest';
import type { AlertsRepository } from './alertsRepository';
import type { NewAlert } from './types';

/**
 * Pruebas que TODA implementación de AlertsRepository debe pasar.
 * `create` entrega un repositorio vacío para cada prueba.
 */
export function describeAlertsRepository(
  name: string,
  create: () => Promise<AlertsRepository>,
): void {
  describe(name, () => {
    let repo: AlertsRepository;

    const base = (over: Partial<NewAlert> = {}): NewAlert => ({
      channel: 'messenger',
      source: 'Grupo de prueba',
      risk: 'alto',
      comment: { author: 'Ana', text: 'Esto es una estafa', postedAt: '2026-10-01T10:00:00.000Z' },
      thread: [],
      suggestedReply: null,
      postUrl: null,
      ...over,
    });

    beforeEach(async () => {
      repo = await create();
    });

    it('empieza sin alertas', async () => {
      expect(await repo.list('nueva')).toHaveLength(0);
      expect(await repo.list('atendida')).toHaveLength(0);
    });

    it('guarda una alerta y la devuelve con id, estado y fecha', async () => {
      const saved = await repo.add(base());
      expect(saved.id).toBeTruthy();
      expect(saved.status).toBe('nueva');
      expect(saved.detectedAt).toBeTruthy();
      expect(saved.comment.text).toBe('Esto es una estafa');

      const nuevas = await repo.list('nueva');
      expect(nuevas).toHaveLength(1);
      expect(nuevas[0]?.id).toBe(saved.id);
    });

    it('conserva el hilo de comentarios y la respuesta sugerida', async () => {
      const saved = await repo.add(
        base({
          thread: [{ author: 'Luis', text: 'A mí también', postedAt: '2026-10-01T11:00:00.000Z' }],
          suggestedReply: { title: 'Sugerencia', text: 'Hola, lamentamos esto.' },
        }),
      );
      const found = (await repo.list('nueva')).find((a) => a.id === saved.id);
      expect(found?.thread).toHaveLength(1);
      expect(found?.suggestedReply?.text).toBe('Hola, lamentamos esto.');
    });

    it('ordena las alertas de la más reciente a la más antigua', async () => {
      await repo.add(base({ detectedAt: '2026-10-01T08:00:00.000Z' }));
      await repo.add(base({ detectedAt: '2026-10-03T08:00:00.000Z' }));
      await repo.add(base({ detectedAt: '2026-10-02T08:00:00.000Z' }));
      const nuevas = await repo.list('nueva');
      expect(nuevas.map((a) => a.detectedAt)).toEqual([
        '2026-10-03T08:00:00.000Z',
        '2026-10-02T08:00:00.000Z',
        '2026-10-01T08:00:00.000Z',
      ]);
    });

    it('marca una alerta como atendida y la mueve al historial', async () => {
      const saved = await repo.add(base());
      await repo.markAttended(saved.id);
      expect(await repo.list('nueva')).toHaveLength(0);
      const historial = await repo.list('atendida');
      expect(historial).toHaveLength(1);
      expect(historial[0]?.id).toBe(saved.id);
    });

    it('devuelve la configuración por defecto antes de guardar nada', async () => {
      const settings = await repo.getSettings();
      expect(settings.sensitivity).toBe('normal');
      expect(Array.isArray(settings.keywords)).toBe(true);
    });

    it('actualiza la configuración de forma parcial', async () => {
      await repo.saveSettings({ sensitivity: 'grave', keywords: ['fraude'] });
      const updated = await repo.saveSettings({ notifyByWhatsApp: false });
      expect(updated.sensitivity).toBe('grave');
      expect(updated.keywords).toEqual(['fraude']);
      expect(updated.notifyByWhatsApp).toBe(false);
    });

    it('clear borra todas las alertas pero no la configuración', async () => {
      await repo.add(base());
      await repo.saveSettings({ sensitivity: 'todo' });
      await repo.clear();
      expect(await repo.list('nueva')).toHaveLength(0);
      expect((await repo.getSettings()).sensitivity).toBe('todo');
    });
  });
}
