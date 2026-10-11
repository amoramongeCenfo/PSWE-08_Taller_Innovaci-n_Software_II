import { useEffect, useState } from 'react';
import { knowledgeService } from './knowledgeService';
import type { BusinessKnowledge, RenderResult } from './types';

const DELAY_MS = 400;

/**
 * Vista previa de una plantilla con el borrador actual (sin guardarlo). Espera a que la persona
 * deje de escribir para no llamar al servidor con cada tecla. Mientras tanto muestra la última.
 */
export function useTemplatePreview(
  template: string,
  knowledge: BusinessKnowledge,
  initial: RenderResult,
): { preview: RenderResult; failed: boolean } {
  const [preview, setPreview] = useState(initial);
  const [failed, setFailed] = useState(false);
  const knowledgeKey = JSON.stringify(knowledge);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      knowledgeService
        .preview(template, JSON.parse(knowledgeKey) as BusinessKnowledge)
        .then((result) => {
          if (cancelled) return;
          setPreview(result);
          setFailed(false);
        })
        .catch(() => {
          if (!cancelled) setFailed(true);
        });
    }, DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [template, knowledgeKey]);

  return { preview, failed };
}
