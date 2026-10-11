import { configureStore } from '@reduxjs/toolkit';
import { assistantReducer } from '../features/assistant';
import { authReducer } from '../features/auth';
import { businessReducer } from '../features/business';
import { channelsReducer } from '../features/channels';
import { knowledgeReducer } from '../features/knowledge';
import { conversationsReducer } from '../features/messages';

/**
 * Estado global de la aplicación. Cada área (feature) aporta su propio "slice".
 * Para agregar uno nuevo: crea su slice en features/<area>/ y regístralo aquí.
 */
export const store = configureStore({
  reducer: {
    assistant: assistantReducer,
    auth: authReducer,
    business: businessReducer,
    channels: channelsReducer,
    conversations: conversationsReducer,
    knowledge: knowledgeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
