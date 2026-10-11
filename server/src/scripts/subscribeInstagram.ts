// Debe ir primero: carga server/.env antes de que `config` lea las variables.
import '../env';
import { loadConfig } from '../config';
import {
  createInstagramSubscription,
  InstagramSubscriptionError,
  type InstagramSubscription,
} from '../modules/instagram/instagram.subscription';

/**
 * Suscribe tu app de Meta a tu cuenta de Instagram para recibir mensajes reales.
 * Uso:  pnpm --filter @colibri/server instagram:subscribe
 */
function describe(apps: InstagramSubscription[]): string {
  return apps.length === 0
    ? '  (ninguna)'
    : apps
        .map(
          (app) =>
            `  - ${app.name ?? 'sin nombre'} (${app.id ?? 'sin id'}): ${app.fields.join(', ') || 'sin eventos'}`,
        )
        .join('\n');
}

async function main(): Promise<void> {
  const { instagram } = loadConfig();
  const subscription = createInstagramSubscription(instagram);

  const me = await subscription.whoAmI();
  console.log(`Cuenta del token: @${me.username ?? 'sin usuario'} (id ${me.accountId ?? 'N/A'})`);
  if (me.accountId && me.accountId !== instagram.accountId) {
    console.warn(
      `AVISO: INSTAGRAM_ACCOUNT_ID en server/.env es "${instagram.accountId || '(vacío)'}", pero la cuenta del token es ${me.accountId}. Corrígelo y reinicia pnpm dev.`,
    );
  }

  console.log('Apps suscritas a tu cuenta de Instagram ahora:');
  console.log(describe(await subscription.list()));

  await subscription.subscribe();
  console.log('\nSuscripción enviada. Apps suscritas después:');
  console.log(describe(await subscription.list()));
  console.log(
    '\nListo. Escribe por mensaje directo a la cuenta desde otra cuenta con rol en la app.',
  );
}

main().catch((error: unknown) => {
  const message =
    error instanceof InstagramSubscriptionError ? error.message : 'No se pudo contactar a Meta';
  console.error(`Error: ${message}`);
  process.exit(1);
});
