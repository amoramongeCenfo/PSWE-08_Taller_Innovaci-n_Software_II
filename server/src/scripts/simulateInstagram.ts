// Debe ir primero: carga server/.env antes de que `config` lea las variables.
import '../env';
import { createHmac, randomUUID } from 'node:crypto';
import { loadConfig } from '../config';
import { SIMULATED_PREFIX } from '../modules/instagram/instagram.client';

/**
 * Simula que una persona escribe por Instagram, sin usar Meta. Envía al servidor local el mismo
 * evento que enviaría Meta, firmado con INSTAGRAM_APP_SECRET, así que recorre el camino real.
 *
 * Uso:
 *   pnpm --filter @colibri/server instagram:simulate "Hola, ¿a qué hora abren?" --from "Ana Mora"
 *
 * Requiere el servidor corriendo y, en server/.env, INSTAGRAM_VERIFY_TOKEN, INSTAGRAM_APP_SECRET
 * e INSTAGRAM_SIMULATE=true (para que el contacto muestre su nombre y se puedan "enviar" respuestas).
 */
function parseArgs(argv: string[]): { text: string; from: string } {
  let from = 'Cliente de prueba';
  const words: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] as string;
    if (arg === '--from') from = argv[++i] ?? from;
    else words.push(arg);
  }
  return { text: words.join(' ').trim() || 'Hola, ¿a qué hora abren?', from: from.trim() };
}

async function main(): Promise<void> {
  const appConfig = loadConfig();
  const { instagram } = appConfig;
  if (!instagram.appSecret) {
    throw new Error('Define INSTAGRAM_APP_SECRET (y INSTAGRAM_VERIFY_TOKEN) en server/.env');
  }
  if (!instagram.simulate) {
    console.warn(
      'Aviso: INSTAGRAM_SIMULATE no es "true"; el contacto saldrá sin nombre y no podrás responder.',
    );
  }

  const { text, from } = parseArgs(process.argv.slice(2));
  const accountId = instagram.accountId || 'sim-account';
  const body = JSON.stringify({
    object: 'instagram',
    entry: [
      {
        id: accountId,
        messaging: [
          {
            sender: { id: `${SIMULATED_PREFIX}${from}` },
            recipient: { id: accountId },
            timestamp: Date.now(),
            message: { mid: `sim.in.${randomUUID()}`, text },
          },
        ],
      },
    ],
  });
  const signature = createHmac('sha256', instagram.appSecret).update(body).digest('hex');

  const url = `http://localhost:${appConfig.server.port}/api/webhooks/instagram`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': `sha256=${signature}` },
    body,
  });
  if (!response.ok) throw new Error(`El servidor respondió ${response.status}`);
  console.log(`Mensaje simulado enviado: ${from}: "${text}"`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message} (¿está corriendo el servidor con pnpm dev?)`);
  process.exit(1);
});
