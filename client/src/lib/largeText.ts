/**
 * Preferencia "Texto grande". Se guarda en este navegador (no es un dato del negocio) y se
 * aplica como una clase en <html> que agranda la escala tipográfica (ver styles/global.css).
 */
const STORAGE_KEY = 'colibri_texto_grande';
const CLASS_NAME = 'texto-grande';

export function readLargeText(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function applyLargeText(enabled: boolean): void {
  document.documentElement.classList.toggle(CLASS_NAME, enabled);
  try {
    if (enabled) localStorage.setItem(STORAGE_KEY, '1');
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Navegación privada o almacenamiento bloqueado: se aplica solo en esta visita.
  }
}
