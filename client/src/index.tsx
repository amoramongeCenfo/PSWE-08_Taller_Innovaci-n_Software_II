import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { restoreSession, sessionExpired } from './features/auth';
import { setUnauthorizedHandler } from './lib/http';
import { applyLargeText, readLargeText } from './lib/largeText';
import { store } from './store';
import './styles/global.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('No se encontró el elemento #root');
}

// "Texto grande" se aplica antes de pintar para que la pantalla no salte de tamaño.
applyLargeText(readLargeText());

// Si el servidor dice que la sesión venció, la app vuelve sola a la pantalla de inicio de sesión.
setUnauthorizedHandler(() => store.dispatch(sessionExpired()));

// Comprueba la sesión una sola vez al abrir la aplicación, antes de mostrar las rutas.
void store.dispatch(restoreSession());

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
