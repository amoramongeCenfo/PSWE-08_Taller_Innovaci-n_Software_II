import { Icon } from '../../components/Icon';

interface PanelMessageProps {
  icon: string;
  title: string;
  text: string;
}

/** Aviso centrado para paneles vacíos (sin conversaciones, sin conversación elegida, etc.). */
export function PanelMessage({ icon, title, text }: PanelMessageProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-space-sm p-space-lg text-center">
      <div
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-low text-outline"
      >
        <Icon name={icon} size={24} />
      </div>
      <h2 className="font-headline-sm text-headline-sm text-on-surface">{title}</h2>
      <p className="max-w-xs font-body-sm text-body-sm text-on-surface-variant">{text}</p>
    </div>
  );
}
