import { Link } from 'react-router';
import { PageHeader } from '../components/PageHeader';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-start gap-space-md">
      <PageHeader
        title="No encontramos esta página"
        description="Revisa la dirección o vuelve al inicio."
      />
      <Link
        to="/"
        className="rounded-xl bg-primary-container px-space-md py-2.5 font-label-md text-label-md font-semibold text-on-primary-container shadow-sm transition-opacity hover:opacity-90"
      >
        Ir al inicio
      </Link>
    </div>
  );
}
