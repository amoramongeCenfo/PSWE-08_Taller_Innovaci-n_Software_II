import { WEEK_DAYS, type BusinessKnowledge, type DayHours, type WeekDay } from '../knowledge/types';

const DAY_NAMES: Record<WeekDay, string> = {
  mon: 'lunes',
  tue: 'martes',
  wed: 'miércoles',
  thu: 'jueves',
  fri: 'viernes',
  sat: 'sábado',
  sun: 'domingo',
};

/** Día y minutos desde la medianoche en la zona horaria del negocio. */
export function localTime(now: Date, timeZone: string): { day: WeekDay; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  const weekday = get('weekday').toLowerCase().slice(0, 3) as WeekDay;
  return { day: weekday, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

const toMinutes = (time: string) => {
  const [h = 0, m = 0] = time.split(':').map(Number);
  return h * 60 + m;
};

/** "08:00" -> "8 a. m.", "18:30" -> "6:30 p. m.", "12:00" -> "12 m." (mediodía, como en Costa Rica). */
export function formatTime(time: string): string {
  const [h = 0, m = 0] = time.split(':').map(Number);
  if (h === 12 && m === 0) return '12 m.';
  const suffix = h < 12 ? 'a. m.' : 'p. m.';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour12} ${suffix}` : `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** "a las 8 a. m." o "a la 1 p. m.". */
/** Cierra la oración sin duplicar el punto de "a. m." o "p. m.". */
function sentence(text: string): string {
  return text.endsWith('.') ? text : `${text}.`;
}

function atTime(time: string): string {
  const hour = Number(time.split(':')[0]) % 12;
  return `${hour === 1 ? 'a la' : 'a las'} ${formatTime(time)}`;
}

const isOpenDay = (hours: DayHours): hours is { open: string; close: string } =>
  typeof hours === 'object' && hours !== null;

/** ¿Hay al menos un día con horario definido (abierto o cerrado)? */
export function hasHours(knowledge: BusinessKnowledge): boolean {
  return WEEK_DAYS.some((day) => knowledge.hours.days[day] !== null);
}

/** Próximo día (desde mañana) en que el negocio abre: "Mañana abrimos a las 8 a. m.". */
function nextOpening(knowledge: BusinessKnowledge, today: WeekDay): string {
  const start = WEEK_DAYS.indexOf(today);
  for (let offset = 1; offset <= 7; offset += 1) {
    const day = WEEK_DAYS[(start + offset) % 7] as WeekDay;
    const hours = knowledge.hours.days[day];
    if (isOpenDay(hours)) {
      const when = offset === 1 ? 'Mañana' : `El ${DAY_NAMES[day]}`;
      return sentence(`${when} abrimos ${atTime(hours.open)}`);
    }
  }
  return '';
}

/** Frase para hoy según la hora: abre más tarde, está abierto, ya cerró o no abre hoy. */
export function describeToday(
  knowledge: BusinessKnowledge,
  now: Date,
  timeZone: string,
): string | null {
  if (!hasHours(knowledge)) return null;
  const { day, minutes } = localTime(now, timeZone);
  const today = knowledge.hours.days[day];

  if (!isOpenDay(today)) {
    return `Hoy ${DAY_NAMES[day]} estamos cerrados. ${nextOpening(knowledge, day)}`.trim();
  }
  const open = toMinutes(today.open);
  const close = toMinutes(today.close);
  if (minutes < open) {
    return sentence(`Hoy abrimos ${atTime(today.open)} y cerramos ${atTime(today.close)}`);
  }
  if (minutes < close)
    return sentence(`Hoy estamos abiertos hasta ${atTime(today.close).replace(/^a /, '')}`);
  return `Hoy ya cerramos (atendimos de ${formatTime(today.open)} a ${formatTime(today.close)}). ${nextOpening(knowledge, day)}`.trim();
}

/** Horario de la semana, agrupando días seguidos iguales: "lunes a viernes de 8 a. m. a 6 p. m.; …". */
export function describeWeek(knowledge: BusinessKnowledge): string | null {
  if (!hasHours(knowledge)) return null;
  const label = (hours: DayHours) =>
    isOpenDay(hours) ? `de ${formatTime(hours.open)} a ${formatTime(hours.close)}` : 'cerrado';

  const groups: { from: WeekDay; to: WeekDay; text: string }[] = [];
  for (const day of WEEK_DAYS) {
    const hours = knowledge.hours.days[day];
    if (hours === null) continue;
    const text = label(hours);
    const last = groups.at(-1);
    const previousDay = WEEK_DAYS[WEEK_DAYS.indexOf(day) - 1];
    if (last && last.text === text && last.to === previousDay) last.to = day;
    else groups.push({ from: day, to: day, text });
  }
  return groups
    .map(({ from, to, text }) => {
      const days =
        from === to
          ? DAY_NAMES[from]
          : WEEK_DAYS.indexOf(to) - WEEK_DAYS.indexOf(from) === 1
            ? `${DAY_NAMES[from]} y ${DAY_NAMES[to]}`
            : `${DAY_NAMES[from]} a ${DAY_NAMES[to]}`;
      return `${days} ${text}`;
    })
    .join('; ');
}
