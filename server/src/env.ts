/**
 * Carga `server/.env` (si existe) en `process.env`.
 * Debe importarse PRIMERO en index.ts: el paquete `config` lee las variables al cargarse.
 */
try {
  process.loadEnvFile();
} catch {
  // No hay archivo .env: se usan los valores por defecto o las variables del sistema.
}
