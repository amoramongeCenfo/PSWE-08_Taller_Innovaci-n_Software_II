import poster from '../../assets/media/colibri-demo-poster.png';
import demoVideo from '../../assets/media/colibri-demo.mp4';

/**
 * Video de un minuto con el recorrido de Colibri: registro, bandeja unificada (WhatsApp e
 * Instagram), respuesta automática y "Mi negocio". Grabado con datos de ejemplo.
 */
export function SampleVideoCard() {
  return (
    <section className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-card">
      <video
        src={demoVideo}
        poster={poster}
        controls
        preload="metadata"
        className="aspect-video w-full bg-[#0f1b2d]"
        aria-label="Video demostrativo de Colibri"
      />
      <div className="flex flex-col gap-space-xs p-space-lg">
        <h2 className="font-headline-sm text-headline-sm text-on-surface">
          Mira cómo funciona en un minuto
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Un recorrido por la bandeja unificada y cómo Colibri responde por tu negocio.
        </p>
      </div>
    </section>
  );
}
