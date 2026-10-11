import type { AssistantSettings, AssistantSettingsInput } from './types';

/** Ajustes del asistente (uno por instalación). Memoria y PostgreSQL pasan las mismas pruebas. */
export interface AssistantRepository {
  /** Siempre devuelve algo: los valores iniciales si nunca se guardó nada. */
  get(): Promise<AssistantSettings>;
  /**
   * Guarda los ajustes. Si `completedAt` tiene valor y la bienvenida no estaba completa, la marca
   * como completa con esa fecha (la primera fecha se conserva).
   */
  save(input: AssistantSettingsInput, completedAt: string | null): Promise<AssistantSettings>;
  /** Vuelve a mostrar la bienvenida, sin tocar los ajustes guardados. */
  resetOnboarding(): Promise<void>;
  /** Borra todo: vuelve a los valores iniciales y a la bienvenida pendiente. */
  clear(): Promise<void>;
}
