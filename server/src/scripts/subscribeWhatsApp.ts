// Debe ir primero: carga server/.env antes de que `config` lea las variables.
import '../env';
import { loadConfig } from '../config';
import {
  createWhatsAppSubscription,
  SubscriptionError,
  type SubscribedApp,
} from '../modules/whatsapp/whatsapp.subscription';

/**
 * Suscribe tu app de Meta a tu cuenta de WhatsApp Business para recibir mensajes reales.
 * Uso:  pnpm --filter @colibri/server whatsapp:subscribe
 */
function describe(apps: SubscribedApp[]): string {
  return apps.length === 0
    ? '  (ninguna)'
    : apps.map((app) => `  - ${app.name ?? 'sin nombre'} (${app.id ?? 'sin id'})`).join('\n');
}

async function main(): Promise<void> {
  const subscription = createWhatsAppSubscription(loadConfig().whatsapp);

  console.log('Apps suscritas a tu cuenta de WhatsApp Business ahora:');
  console.log(describe(await subscription.list()));

  await subscription.subscribe();
  console.log('\nSuscripción enviada. Apps suscritas después:');
  console.log(describe(await subscription.list()));
  console.log('\nListo. Escribe un mensaje desde tu teléfono al número de prueba.');
}

main().catch((error: unknown) => {
  const message =
    error instanceof SubscriptionError ? error.message : 'No se pudo contactar a Meta';
  console.error(`Error: ${message}`);
  process.exit(1);
});
