import { apiRequest } from '../../lib/http';
import type { KnowledgeService } from './knowledgeService';
import type { KnowledgeView, RenderResult } from './types';

export const httpKnowledgeService: KnowledgeService = {
  get: () => apiRequest<KnowledgeView>('/knowledge'),
  save: (knowledge) =>
    apiRequest<KnowledgeView>('/knowledge', { method: 'PUT', body: JSON.stringify(knowledge) }),
  preview: (template, knowledge) =>
    apiRequest<RenderResult>('/knowledge/preview', {
      method: 'POST',
      body: JSON.stringify({ template, knowledge }),
    }),
};
