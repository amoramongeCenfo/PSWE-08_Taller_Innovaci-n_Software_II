import { canReceiveInstagram, type InstagramConfig } from '../../config';
import type { ConversationService } from '../conversations/conversationService';
import { createMetaWebhookRouter, type ProfileLookup } from '../channels/metaWebhookRouter';
import { explainInvalidWebhook, parseInstagramWebhook } from './instagram.mapper';

export type { ProfileLookup } from '../channels/metaWebhookRouter';

/** Rutas que llama Meta. Se montan en /api/webhooks/instagram. */
export function createInstagramRouter(
  config: InstagramConfig,
  conversations: ConversationService,
  lookupName?: ProfileLookup,
) {
  return createMetaWebhookRouter(
    {
      label: 'Instagram',
      envPrefix: 'INSTAGRAM',
      accountVariable: 'INSTAGRAM_ACCOUNT_ID',
      isConfigured: canReceiveInstagram(config),
      verifyToken: config.verifyToken,
      appSecret: config.appSecret,
      accountId: config.accountId,
      debugWebhook: config.debugWebhook,
      parse: parseInstagramWebhook,
      explainInvalid: explainInvalidWebhook,
      lookupName,
    },
    conversations,
  );
}
