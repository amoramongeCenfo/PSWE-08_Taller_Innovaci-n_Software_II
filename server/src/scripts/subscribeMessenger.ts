// Debe ir primero: carga server/.env antes de que `config` lea las variables.
import '../env';
import { loadConfig } from '../config';
import {
  createMessengerSubscription,
  MessengerSubscriptionError,
  UserTokenError,
  type PageSubscription,
} from '../modules/messenger/messenger.subscription';

/**
 * Suscribe tu app de Meta a tu página de Facebook para recibir mensajes de Messenger.
 * Uso:  pnpm --filter @colibri/server messenger:subscribe
 */
function describe(apps: PageSubscription[]): string {
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
  const { messenger } = loadConfig();
  const subscription = createMessengerSubscription(messenger);

  // Leer el nombre de la página pide un permiso extra (pages_read_engagement). Si no está,
  // se avisa y se sigue: la suscripción solo necesita pages_manage_metadata.
  try {
    const page = await subscription.whoAmI();
    console.log(`Página del token: ${page.name ?? 'sin nombre'} (id ${page.pageId ?? 'N/A'})`);
    if (page.pageId && page.pageId !== messenger.pageId) {
      console.warn(
        `AVISO: MESSENGER_PAGE_ID en server/.env es "${messenger.pageId || '(vacío)'}", pero la página del token es ${page.pageId}. Corrígelo y reinicia pnpm dev.`,
      );
    }
  } catch (error) {
    // Con un token de usuario no tiene sentido seguir: la suscripción fallaría igual.
    if (error instanceof UserTokenError) throw error;
    const reason =
      error instanceof MessengerSubscriptionError ? error.message : 'error desconocido';
    console.warn(`No se pudo leer la página del token (se continúa): ${reason}`);
    console.warn(
      `MESSENGER_PAGE_ID en server/.env: "${messenger.pageId || '(vacío)'}". Si está vacío, copia el id de la página que muestra Messenger API Settings junto al nombre de la página.`,
    );
  }

  console.log('\nApps suscritas a tu página ahora:');
  console.log(describe(await subscription.list()));

  await subscription.subscribe();
  console.log('\nSuscripción enviada. Apps suscritas después:');
  console.log(describe(await subscription.list()));
  console.log('\nListo. Escribe a la página por Messenger desde un perfil con rol en la app.');
}

main().catch((error: unknown) => {
  const message =
    error instanceof MessengerSubscriptionError ? error.message : 'No se pudo contactar a Meta';
  console.error(`Error: ${message}`);
  process.exit(1);
});
