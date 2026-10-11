import type { AssistantRepository } from '../assistant/assistantRepository';
import type { AssistantSettings } from '../assistant/types';
import type { KnowledgeRepository } from '../knowledge/knowledgeRepository';
import { AUTO_TOPICS, type AutoTopic, type BusinessKnowledge } from '../knowledge/types';
import type { BusinessRepository } from '../profile/businessRepository';
import {
  defaultTemplate,
  renderTemplate,
  TEMPLATE_VARIABLES,
  templateFor,
  TOPIC_VARIABLES,
  type RenderResult,
  type TemplateContext,
} from './templates';

/** Cómo queda cada tema: qué plantilla usa y si ya puede contestar solo. */
export interface TopicStatus {
  /** Plantilla en uso (la personalizada o la de fábrica). */
  template: string;
  /** Plantilla de fábrica con el tono y el trato actuales, para "Restaurar plantilla original". */
  defaultTemplate: string;
  custom: boolean;
  /** Variables sugeridas para este tema (los botones de la pantalla). */
  variables: { name: string; label: string; optional: boolean }[];
  /** Respuesta de ejemplo con la información actual. */
  preview: RenderResult;
}

export interface KnowledgeView {
  knowledge: BusinessKnowledge;
  topics: Record<AutoTopic, TopicStatus>;
}

/**
 * Redactor de respuestas: junta la información del negocio, el estilo del asistente y el nombre
 * del negocio, y arma el texto de cada tema. Lo usan la pantalla (vista previa) y el motor.
 */
export class ReplyComposer {
  constructor(
    private readonly knowledge: KnowledgeRepository,
    private readonly assistant: AssistantRepository,
    private readonly business: BusinessRepository,
    private readonly timeZone: string,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Contexto con los datos guardados. `knowledge` permite probar un borrador sin guardarlo. */
  async context(
    knowledge?: BusinessKnowledge,
    settings?: AssistantSettings,
  ): Promise<TemplateContext> {
    const [saved, style, business] = await Promise.all([
      knowledge ?? this.knowledge.get(),
      settings ?? this.assistant.get(),
      this.business.get(),
    ]);
    return {
      knowledge: saved,
      tone: style.tone,
      treatment: style.treatment,
      signature: style.signature,
      businessName: business.name,
      now: this.now(),
      timeZone: this.timeZone,
    };
  }

  /** Texto que se enviaría para un tema, con la plantilla que corresponda. */
  async compose(topic: AutoTopic, settings?: AssistantSettings): Promise<RenderResult> {
    const ctx = await this.context(undefined, settings);
    return renderTemplate(templateFor(topic, ctx).template, ctx);
  }

  /** Vista previa de una plantilla (guardada o no) con un borrador de la información. */
  async preview(template: string, knowledge?: BusinessKnowledge): Promise<RenderResult> {
    return renderTemplate(template, await this.context(knowledge));
  }

  /** Todo lo que necesita la pantalla "Lo que Colibri sabe de tu negocio". */
  async view(knowledge?: BusinessKnowledge): Promise<KnowledgeView> {
    const ctx = await this.context(knowledge);
    const topics = Object.fromEntries(
      AUTO_TOPICS.map((topic) => {
        const { template, custom } = templateFor(topic, ctx);
        const status: TopicStatus = {
          template,
          defaultTemplate: defaultTemplate(topic, ctx.tone, ctx.treatment),
          custom,
          variables: TOPIC_VARIABLES[topic].map((name) => ({
            name,
            label: TEMPLATE_VARIABLES[name].label,
            optional: TEMPLATE_VARIABLES[name].optional,
          })),
          preview: renderTemplate(template, ctx),
        };
        return [topic, status];
      }),
    ) as Record<AutoTopic, TopicStatus>;
    return { knowledge: ctx.knowledge, topics };
  }
}
