import { canReceiveMessenger, type MessengerConfig } from '../../config';
import type { ConversationService } from '../conversations/conversationService';
import { createMetaWebhookRouter, type ProfileLookup } from '../channels/metaWebhookRouter';
import { explainInvalidMessengerWebhook, parseMessengerWebhook } from './messenger.mapper';

/** Rutas que llama Meta. Se montan en /api/webhooks/messenger. */
export function createMessengerRouter(
  config: MessengerConfig,
  conversations: ConversationService,
  lookupName?: ProfileLookup,
) {
  return createMetaWebhookRouter(
    {
      label: 'Messenger',
      envPrefix: 'MESSENGER',
      accountVariable: 'MESSENGER_PAGE_ID',
      isConfigured: canReceiveMessenger(config),
      verifyToken: config.verifyToken,
      appSecret: config.appSecret,
      accountId: config.pageId,
      debugWebhook: config.debugWebhook,
      parse: parseMessengerWebhook,
      explainInvalid: explainInvalidMessengerWebhook,
      lookupName,
    },
    conversations,
  );
}
