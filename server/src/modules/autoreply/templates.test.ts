import { describe, expect, it } from 'vitest';
import { SAMPLE_KNOWLEDGE } from '../knowledge/knowledgeRepository.contract';
import { AUTO_TOPICS, EMPTY_KNOWLEDGE } from '../knowledge/types';
import {
  defaultTemplate,
  findUnknownVariables,
  renderTemplate,
  templateFor,
  type TemplateContext,
} from './templates';

const ctx = (over: Partial<TemplateContext> = {}): TemplateContext => ({
  knowledge: SAMPLE_KNOWLEDGE,
  tone: 'cercano',
  treatment: 'usted',
  signature: 'Café Pura Vida',
  businessName: 'Café Pura Vida',
  now: new Date('2026-10-12T16:00:00Z'), // lunes 10 a. m. en Costa Rica
  timeZone: 'America/Costa_Rica',
  ...over,
});

describe('plantillas de fábrica', () => {
  it('arman una respuesta lista para cada tema con datos', () => {
    const knowledge = {
      ...SAMPLE_KNOWLEDGE,
      availability: 'Hoy hay tazas.',
      orders: 'Encargos con 3 días.',
    };
    for (const topic of AUTO_TOPICS) {
      const result = renderTemplate(defaultTemplate(topic, 'cercano', 'usted'), ctx({ knowledge }));
      expect(result.ready, topic).toBe(true);
      expect(result.text).not.toMatch(/[{}]| {2}/);
    }
  });

  it('horario en tono cercano con "usted"', () => {
    const { text } = renderTemplate(defaultTemplate('hours', 'cercano', 'usted'), ctx());
    expect(text).toBe(
      '¡Hola! Con gusto le ayudo. Hoy estamos abiertos hasta las 6 p. m. Nuestro horario: lunes a viernes de 8 a. m. a 6 p. m.; sábado de 9 a. m. a 1 p. m.; domingo cerrado. Los feriados abrimos de 9 a. m. a 1 p. m. ¡Le esperamos! — Café Pura Vida',
    );
  });

  it('cambia con el trato y el tono', () => {
    const vos = renderTemplate(
      defaultTemplate('location', 'cercano', 'vos'),
      ctx({ treatment: 'vos' }),
    );
    expect(vos.text).toContain('Con gusto te ayudo');
    expect(vos.text).toContain('¡Te esperamos!');
    const pro = renderTemplate(
      defaultTemplate('pricing', 'profesional', 'usted'),
      ctx({ tone: 'profesional' }),
    );
    expect(pro.text).toMatch(/^Buenos días, gracias por escribirnos\./);
    expect(pro.text).toContain('SINPE Móvil: 8888-7777 a nombre de Café Pura Vida.');
    const brief = renderTemplate(
      defaultTemplate('shipping', 'breve', 'tu'),
      ctx({ tone: 'breve' }),
    );
    expect(brief.text).toBe(
      'Enviamos por Correos de Costa Rica a todo el país (₡3.000). — Café Pura Vida',
    );
  });
});

describe('renderTemplate', () => {
  it('omite las variables opcionales vacías y marca las obligatorias', () => {
    const empty = renderTemplate(
      '{saludo} Estamos en {direccion}. {senas} {firma}',
      ctx({ knowledge: EMPTY_KNOWLEDGE, signature: null }),
    );
    expect(empty.missing).toEqual(['Dirección']);
    expect(empty.ready).toBe(false);
    expect(empty.text).toBe('¡Hola! Con gusto le ayudo. Estamos en.');
  });

  it('rechaza variables que no existen y textos demasiado largos', () => {
    expect(findUnknownVariables('Hola {telefono} {direccion} {otra}')).toEqual([
      'telefono',
      'otra',
    ]);
    expect(renderTemplate('Hola {telefono}', ctx()).ready).toBe(false);
    expect(renderTemplate('a'.repeat(1001), ctx()).ready).toBe(false);
  });

  it('usa la plantilla personalizada si existe', () => {
    expect(templateFor('location', ctx())).toEqual({
      template: '{saludo} Estamos en {direccion}. {firma}',
      custom: true,
    });
    expect(templateFor('hours', ctx()).custom).toBe(false);
  });
});
