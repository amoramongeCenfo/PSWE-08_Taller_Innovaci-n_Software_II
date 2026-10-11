// Debe ir primero: carga server/.env antes de que `config` lea las variables.
import '../env';
import { loadConfig } from '../config';
import { runMigrations } from '../db/migrate';
import { createPool } from '../db/pool';
import { PostgresAssistantRepository } from '../modules/assistant/postgresAssistantRepository';

/**
 * Vuelve a mostrar la bienvenida de 3 pasos (útil para presentaciones y pruebas).
 *
 * Uso:
 *   pnpm --filter @colibri/server onboarding:reset           Conserva reglas, temas y tono.
 *   pnpm --filter @colibri/server onboarding:reset --todo    También vuelve a los valores iniciales.
 *
 * Después, recarga la página de Colibri (F5).
 */
async function main(): Promise<void> {
  const { database } = loadConfig();
  if (!database.url) {
    console.log(
      'No hay DATABASE_URL: el servidor guarda todo en memoria. Reinicia `pnpm dev` y la bienvenida vuelve a aparecer.',
    );
    return;
  }

  const everything = process.argv.slice(2).includes('--todo');
  const pool = createPool(database.url);
  try {
    // Por si el servidor nunca se inició con esta versión: crea las tablas que falten.
    await runMigrations(pool);
    const repository = new PostgresAssistantRepository(pool);
    if (everything) {
      await repository.clear();
      console.log(
        'Listo: se borraron los ajustes del asistente y la bienvenida volverá a aparecer.',
      );
    } else {
      await repository.resetOnboarding();
      console.log(
        'Listo: la bienvenida volverá a aparecer (tus reglas, temas y tono se conservan).',
      );
    }
    console.log('Recarga la página de Colibri (F5) para verla.');
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  // Lo más común: DATABASE_URL incorrecta o PostgreSQL apagado.
  console.error('Error:', error instanceof Error ? error.message : error);
  process.exit(1);
});
