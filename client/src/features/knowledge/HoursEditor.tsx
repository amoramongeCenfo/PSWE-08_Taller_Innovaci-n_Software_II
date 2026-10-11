import { Button, Input, SegmentedControl, TextField } from '../../components/ui';
import {
  DAY_LABELS,
  KNOWLEDGE_LIMITS,
  WEEK_DAYS,
  type BusinessKnowledge,
  type DayHours,
  type WeekDay,
} from './types';

type DayMode = 'open' | 'closed' | 'unset';

const DAY_MODE_OPTIONS: { value: DayMode; label: string }[] = [
  { value: 'open', label: 'Abierto' },
  { value: 'closed', label: 'Cerrado' },
  { value: 'unset', label: 'Sin definir' },
];

const DEFAULT_OPEN = { open: '08:00', close: '17:00' };
/** Días a los que se copia el horario del lunes. */
export const WEEKDAYS_AFTER_MONDAY: WeekDay[] = ['tue', 'wed', 'thu', 'fri'];

const modeOf = (hours: DayHours): DayMode =>
  hours === null ? 'unset' : hours === 'closed' ? 'closed' : 'open';

/** true si la hora de cierre no va después de la apertura. */
export const hasInvalidHours = (hours: DayHours) =>
  typeof hours === 'object' && hours !== null && !(hours.close > hours.open);

interface HoursEditorProps {
  hours: BusinessKnowledge['hours'];
  onDayChange: (day: WeekDay, hours: DayHours) => void;
  onCopyMonday: () => void;
  onNotesChange: (notes: string) => void;
}

/** Horario por día (apertura y cierre, cerrado o sin definir) y la nota de feriados. */
export function HoursEditor({ hours, onDayChange, onCopyMonday, onNotesChange }: HoursEditorProps) {
  const monday = hours.days.mon;
  return (
    <div className="flex flex-col gap-space-md">
      <ul className="flex flex-col gap-space-sm">
        {WEEK_DAYS.map((day) => (
          <DayRow key={day} day={day} hours={hours.days[day]} onChange={onDayChange} />
        ))}
      </ul>
      {monday !== null && (
        <Button
          variant="ghost"
          startIcon="content_copy"
          onClick={onCopyMonday}
          className="self-start"
        >
          Usar el horario del lunes de martes a viernes
        </Button>
      )}
      <TextField
        label="Feriados u horarios especiales (opcional)"
        placeholder="Ej.: Los feriados abrimos de 9 a. m. a 1 p. m."
        value={hours.notes ?? ''}
        maxLength={KNOWLEDGE_LIMITS.shortText}
        onChange={(event) => onNotesChange(event.target.value)}
      />
    </div>
  );
}

interface DayRowProps {
  day: WeekDay;
  hours: DayHours;
  onChange: (day: WeekDay, hours: DayHours) => void;
}

function DayRow({ day, hours, onChange }: DayRowProps) {
  const label = DAY_LABELS[day];
  const mode = modeOf(hours);
  const invalid = hasInvalidHours(hours);

  const setMode = (next: DayMode) =>
    onChange(day, next === 'open' ? DEFAULT_OPEN : next === 'closed' ? 'closed' : null);

  return (
    <li className="flex flex-col gap-space-sm rounded-xl bg-surface-container-lowest p-space-sm shadow-hairline sm:flex-row sm:items-center">
      <span className="w-24 shrink-0 font-body-md text-body-md font-semibold text-on-surface">
        {label}
      </span>
      <SegmentedControl
        label={`${label}: abierto o cerrado`}
        options={DAY_MODE_OPTIONS}
        value={mode}
        onChange={setMode}
      />
      {typeof hours === 'object' && hours !== null && (
        <div className="flex flex-wrap items-center gap-space-sm sm:ml-auto">
          <span className="flex items-center gap-space-sm">
            <span className="font-body-md text-body-md text-on-surface-variant">de</span>
            <Input
              type="time"
              aria-label={`${label}: abre`}
              value={hours.open}
              required
              invalid={invalid}
              onChange={(event) =>
                event.target.value && onChange(day, { ...hours, open: event.target.value })
              }
              className="w-32"
            />
          </span>
          <span className="flex items-center gap-space-sm">
            <span className="font-body-md text-body-md text-on-surface-variant">a</span>
            <Input
              type="time"
              aria-label={`${label}: cierra`}
              value={hours.close}
              required
              invalid={invalid}
              onChange={(event) =>
                event.target.value && onChange(day, { ...hours, close: event.target.value })
              }
              className="w-32"
            />
          </span>
          {invalid && (
            <span role="alert" className="w-full font-body-sm text-body-sm text-error">
              La hora de cierre va después de la apertura.
            </span>
          )}
        </div>
      )}
    </li>
  );
}
