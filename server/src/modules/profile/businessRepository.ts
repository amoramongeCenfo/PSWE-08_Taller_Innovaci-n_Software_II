import type { Business, BusinessInput } from './types';

/** Almacenamiento del negocio (uno por instalación). Memoria y PostgreSQL pasan las mismas pruebas. */
export interface BusinessRepository {
  /** Siempre devuelve algo: con todo en null si aún no se guardó nada. */
  get(): Promise<Business>;
  /** Guarda nombre y dirección; la región no se toca. Devuelve el negocio ya guardado. */
  save(input: BusinessInput): Promise<Business>;
}
