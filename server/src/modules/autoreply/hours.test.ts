import { describe, expect, it } from 'vitest';
import { SAMPLE_KNOWLEDGE } from '../knowledge/knowledgeRepository.contract';
import { EMPTY_KNOWLEDGE } from '../knowledge/types';
import { describeToday, describeWeek, formatTime, localTime } from './hours';

const TZ = 'America/Costa_Rica';
// Costa Rica es UTC-6 todo el año. 2026-10-12 es lunes; 2026-10-17 sábado; 2026-10-18 domingo.
const at = (iso: string) => new Date(iso);

describe('formatTime', () => {
  it('usa el formato de Costa Rica', () => {
    expect(formatTime('08:00')).toBe('8 a. m.');
    expect(formatTime('18:30')).toBe('6:30 p. m.');
    expect(formatTime('12:00')).toBe('12 m.');
    expect(formatTime('00:00')).toBe('12 a. m.');
  });
});

describe('localTime', () => {
  it('convierte a la hora de Costa Rica', () => {
    expect(localTime(at('2026-10-12T14:30:00Z'), TZ)).toEqual({ day: 'mon', minutes: 8 * 60 + 30 });
    // Las 2 a. m. UTC del martes todavía son lunes en Costa Rica.
    expect(localTime(at('2026-10-13T02:00:00Z'), TZ).day).toBe('mon');
  });
});

describe('describeToday', () => {
  it('antes de abrir, abierto, después de cerrar y día cerrado', () => {
    expect(describeToday(SAMPLE_KNOWLEDGE, at('2026-10-12T13:00:00Z'), TZ)).toBe(
      'Hoy abrimos a las 8 a. m. y cerramos a las 6 p. m.',
    );
    expect(describeToday(SAMPLE_KNOWLEDGE, at('2026-10-12T16:00:00Z'), TZ)).toBe(
      'Hoy estamos abiertos hasta las 6 p. m.',
    );
    expect(describeToday(SAMPLE_KNOWLEDGE, at('2026-10-13T01:00:00Z'), TZ)).toBe(
      'Hoy ya cerramos (atendimos de 8 a. m. a 6 p. m.). Mañana abrimos a las 8 a. m.',
    );
    expect(describeToday(SAMPLE_KNOWLEDGE, at('2026-10-18T16:00:00Z'), TZ)).toBe(
      'Hoy domingo estamos cerrados. Mañana abrimos a las 8 a. m.',
    );
  });

  it('dice "a la 1" y busca el próximo día abierto', () => {
    const knowledge = structuredClone(SAMPLE_KNOWLEDGE);
    knowledge.hours.days.sat = { open: '13:00', close: '17:00' };
    knowledge.hours.days.mon = 'closed';
    expect(describeToday(knowledge, at('2026-10-17T15:00:00Z'), TZ)).toBe(
      'Hoy abrimos a la 1 p. m. y cerramos a las 5 p. m.',
    );
    expect(describeToday(knowledge, at('2026-10-18T16:00:00Z'), TZ)).toBe(
      'Hoy domingo estamos cerrados. El martes abrimos a las 8 a. m.',
    );
  });

  it('devuelve null si no hay horario', () => {
    expect(describeToday(EMPTY_KNOWLEDGE, new Date(), TZ)).toBeNull();
  });
});

describe('describeWeek', () => {
  it('agrupa los días seguidos con el mismo horario', () => {
    expect(describeWeek(SAMPLE_KNOWLEDGE)).toBe(
      'lunes a viernes de 8 a. m. a 6 p. m.; sábado de 9 a. m. a 1 p. m.; domingo cerrado',
    );
  });

  it('usa "y" para dos días y omite los días sin definir', () => {
    const knowledge = structuredClone(EMPTY_KNOWLEDGE);
    knowledge.hours.days.sat = { open: '09:00', close: '12:00' };
    knowledge.hours.days.sun = { open: '09:00', close: '12:00' };
    expect(describeWeek(knowledge)).toBe('sábado y domingo de 9 a. m. a 12 m.');
    expect(describeWeek(EMPTY_KNOWLEDGE)).toBeNull();
  });
});
