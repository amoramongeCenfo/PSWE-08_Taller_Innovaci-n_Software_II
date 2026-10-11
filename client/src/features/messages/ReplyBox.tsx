import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Alert, Button } from '../../components/ui';

interface ReplyBoxProps {
  /** Nombre de la persona, para el texto de ayuda del cuadro. */
  contactLabel: string;
  /** Largo máximo del texto según el canal. */
  maxLength: number;
  isSending: boolean;
  error: string | null;
  /** Envía el texto. Devuelve true si salió bien, para vaciar el cuadro. */
  onSend: (text: string) => Promise<boolean>;
}

/** Cuadro para responder. Enter envía; Shift + Enter agrega una línea. */
export function ReplyBox({ contactLabel, maxLength, isSending, error, onSend }: ReplyBoxProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hintId = useId();
  const canSend = text.trim().length > 0 && !isSending;
  const nearLimit = text.length > maxLength * 0.8;

  const submit = async () => {
    if (!canSend) return;
    if (await onSend(text.trim())) {
      setText('');
      textareaRef.current?.focus();
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-space-xs border-t border-hairline bg-surface-container-lowest p-space-md"
    >
      {error && <Alert tone="error">{error}</Alert>}
      <div className="flex items-end gap-space-sm rounded-2xl bg-surface-container-low p-1.5 pl-space-md focus-within:ring-2 focus-within:ring-primary-container">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          aria-label={`Respuesta para ${contactLabel}`}
          aria-describedby={hintId}
          placeholder="Escribe tu respuesta…"
          rows={1}
          maxLength={maxLength}
          className="max-h-32 min-h-9 flex-1 resize-none bg-transparent py-2 font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none"
        />
        <Button
          type="submit"
          startIcon="send"
          loading={isSending}
          disabled={!canSend}
          className="h-9"
        >
          Enviar
        </Button>
      </div>
      <div
        id={hintId}
        className="flex justify-between gap-space-sm px-1 font-label-sm text-label-sm text-on-surface-variant"
      >
        <span>Enter para enviar · Shift + Enter para otra línea</span>
        {nearLimit && (
          <span>
            {text.length} / {maxLength}
          </span>
        )}
      </div>
    </form>
  );
}
