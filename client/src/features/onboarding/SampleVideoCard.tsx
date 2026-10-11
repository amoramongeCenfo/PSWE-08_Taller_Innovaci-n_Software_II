import poster from '../../assets/media/muestra-colibri-poster.png';
import sampleVideo from '../../assets/media/muestra-colibri.mp4';

/**
 * Video corto de cómo funciona Colibri. Por ahora es un video de muestra (una cuenta regresiva
 * generada para el proyecto, sin derechos de terceros) hasta grabar el tutorial real.
 */
export function SampleVideoCard() {
  return (
    <section className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-card">
      <video
        src={sampleVideo}
        poster={poster}
        controls
        preload="metadata"
        className="aspect-video w-full bg-[#0f1b2d]"
        aria-label="Video de muestra de Colibri"
      />
      <div className="flex flex-col gap-space-xs p-space-lg">
        <h2 className="font-headline-sm text-headline-sm text-on-surface">
          Mira cómo funciona en un minuto
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Un recorrido por cómo Colibri aprende las respuestas de tu negocio. Por ahora es un video
          de muestra.
        </p>
      </div>
    </section>
  );
}
