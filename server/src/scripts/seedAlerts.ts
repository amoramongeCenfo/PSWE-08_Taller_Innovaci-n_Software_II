// Debe ir primero: carga server/.env antes de que `config` lea las variables.
import '../env';
import { loadConfig } from '../config';
import { runMigrations } from '../db/migrate';
import { createPool } from '../db/pool';
import { PostgresAlertsRepository } from '../modules/alerts/postgresAlertsRepository';
import { SAMPLE_ALERTS, SAMPLE_SETTINGS } from '../modules/alerts/sampleAlerts';

/**
 * Carga un conjunto de datos de ejemplo de alertas de reputación en la base de datos, para ver
 * la pantalla de Alertas funcionando con datos reales.
 *
 * Uso:
 *   pnpm --filter @colibri/server alerts:seed            Reemplaza las alertas por el dataset
 *   pnpm --filter @colibri/server alerts:seed -- --keep  Agrega el dataset sin borrar lo existente
 *
 * Requiere DATABASE_URL en server/.env. Sin base de datos, el servidor ya precarga estas mismas
 * alertas en memoria al arrancar, así que no hace falta este script.
 */
async function main(): Promise<void> {
  const appConfig = loadConfig();
  const url = appConfig.database.url;

  if (!url) {
    console.log(
      'No hay DATABASE_URL en server/.env. En modo memoria el servidor ya muestra estas alertas\n' +
        'de ejemplo al arrancar; este script solo aplica cuando usas PostgreSQL.',
    );
    return;
  }

  const keep = process.argv.slice(2).includes('--keep');
  const pool = createPool(url);

  try {
    const applied = await runMigrations(pool);
    if (applied.length > 0) {
      console.log(`Migraciones aplicadas ahora: ${applied.join(', ')}`);
    }

    const repository = new PostgresAlertsRepository(pool);

    if (!keep) {
      await repository.clear();
      console.log('Alertas anteriores borradas.');
    }

    for (const alert of SAMPLE_ALERTS) {
      await repository.add(alert);
    }
    await repository.saveSettings(SAMPLE_SETTINGS);

    const nuevas = await repository.list('nueva');
    const historial = await repository.list('atendida');
    console.log(
      `Dataset cargado: ${nuevas.length} alerta(s) nueva(s), ${historial.length} en el historial.`,
    );
    console.log('Configuración guardada:', JSON.stringify(SAMPLE_SETTINGS));
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error al cargar el dataset: ${message}`);
  console.error('Revisa que DATABASE_URL sea correcta y que PostgreSQL esté encendido.');
  process.exit(1);
});
