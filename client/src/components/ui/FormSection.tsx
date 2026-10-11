import type { ReactNode } from 'react';

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/** Agrupa campos relacionados de un formulario bajo un título (fieldset accesible). */
export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-space-md">
      <legend className="mb-space-md flex flex-col gap-1 p-0">
        <span className="font-headline-sm text-headline-sm text-on-surface">{title}</span>
        {description && (
          <span className="font-body-sm text-body-sm text-on-surface-variant">{description}</span>
        )}
      </legend>
      {children}
    </fieldset>
  );
}
