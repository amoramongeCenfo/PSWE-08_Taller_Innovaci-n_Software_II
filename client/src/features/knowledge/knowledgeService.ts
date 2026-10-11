import { httpKnowledgeService } from './httpKnowledgeService';
import type { BusinessKnowledge, KnowledgeView, RenderResult } from './types';

/**
 * Contrato para la información del negocio que usa Colibri al contestar solo. Endpoints:
 *   get     -> GET  /api/knowledge
 *   save    -> PUT  /api/knowledge
 *   preview -> POST /api/knowledge/preview   (prueba una plantilla con un borrador)
 */
export interface KnowledgeService {
  get(): Promise<KnowledgeView>;
  save(knowledge: BusinessKnowledge): Promise<KnowledgeView>;
  preview(template: string, knowledge: BusinessKnowledge): Promise<RenderResult>;
}

export const knowledgeService: KnowledgeService = httpKnowledgeService;
