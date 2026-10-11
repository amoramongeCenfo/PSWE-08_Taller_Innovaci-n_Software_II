import { Router } from 'express';
import {
  canReceiveInstagram,
  canReceiveMessenger,
  canReceiveWhatsApp,
  canSendInstagram,
  canSendMessenger,
  canSendWhatsApp,
  type AppConfig,
} from '../../config';

type ChannelState = 'active' | 'not_configured';

/** Estado de los canales: lo que el cliente usará para "Canales activos". */
export function createChannelRouter(config: AppConfig): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    const whatsappReady = canReceiveWhatsApp(config.whatsapp) && canSendWhatsApp(config.whatsapp);
    const whatsapp: ChannelState = whatsappReady ? 'active' : 'not_configured';
    const instagramReady =
      canReceiveInstagram(config.instagram) && canSendInstagram(config.instagram);
    const instagram: ChannelState = instagramReady ? 'active' : 'not_configured';
    const messengerReady =
      canReceiveMessenger(config.messenger) && canSendMessenger(config.messenger);
    const messenger: ChannelState = messengerReady ? 'active' : 'not_configured';
    res.json([
      { id: 'whatsapp', name: 'WhatsApp', state: whatsapp },
      { id: 'instagram', name: 'Instagram', state: instagram },
      { id: 'messenger', name: 'Messenger', state: messenger },
    ]);
  });

  return router;
}
