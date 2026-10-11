interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
}

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-space-xs">
      {eyebrow && (
        <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
          {eyebrow}
        </span>
      )}
      <h1 className="font-display-lg text-display-lg tracking-tight text-on-surface">{title}</h1>
      {description && (
        <p className="max-w-3xl font-body-lg text-body-lg text-on-surface-variant">{description}</p>
      )}
    </header>
  );
}
