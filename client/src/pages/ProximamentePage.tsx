import { Link, useNavigate, useSearchParams } from 'react-router';
import { Icon } from '../components/Icon';
import { Button } from '../components/ui';

/**
 * Pantalla única para las opciones que todavía no están programadas. Cualquier enlace puede
 * traer aquí con ?funcion=Nombre para decir qué se intentó abrir (ver comingSoonPath).
 */
interface ProximamentePageProps {
  /** Nombre fijo de la función; si no se indica, se toma de ?funcion= en la dirección. */
  feature?: string;
}

export function ProximamentePage({ feature: fixedFeature }: ProximamentePageProps = {}) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const feature = fixedFeature ?? params.get('funcion')?.trim().slice(0, 80);

  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-space-md py-space-xl md:py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-fixed/50 text-primary">
        <Icon name="construction" size={32} />
      </span>
      <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
        {feature ? `${feature}: muy pronto` : 'Muy pronto'}
      </h1>
      <p className="font-body-lg text-body-lg text-on-surface-variant">
        Esta opción todavía está en construcción. Mientras tanto, puedes seguir usando el resto de
        Colibri con normalidad.
      </p>
      <div className="flex flex-wrap justify-center gap-space-sm">
        <Button variant="secondary" startIcon="arrow_back" onClick={() => navigate(-1)}>
          Volver
        </Button>
        <Link
          to="/"
          className="inline-flex h-11 items-center rounded-xl px-space-lg font-body-md text-body-md font-semibold text-primary hover:bg-primary-fixed/40"
        >
          Ir al inicio
        </Link>
      </div>
    </section>
  );
}
