import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/ui';
import { AssistantSettingsPanel } from '../features/assistant';
import { KnowledgePanel } from '../features/knowledge';
import { ProfileSettings } from '../features/profile';

/**
 * Mi negocio: datos del negocio y de la persona (antes "Perfil") y cómo atiende Colibri (antes
 * "Configuración"). Admite anclas: #perfil, #redes, #que-contesta, #como-habla, #lo-que-sabe y #sabe-<tema>.
 */
export function MiNegocioPage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    // Espera a que las secciones se pinten (algunas cargan datos) antes de desplazarse.
    const timer = window.setTimeout(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [hash]);

  return (
    <div className="flex flex-col gap-space-xl">
      <PageHeader
        title="Mi negocio"
        description="Tus datos, tus redes, lo que Colibri contesta y cómo le habla a tus clientes."
      />

      <Card id="perfil" className="flex scroll-mt-24 flex-col gap-space-lg">
        <header className="flex flex-col gap-space-xs">
          <h2 className="font-headline-md text-headline-md text-on-surface">
            Datos del negocio y tuyos
          </h2>
          <p className="max-w-2xl font-body-md text-body-md text-on-surface-variant">
            Se muestran en toda la aplicación.
          </p>
        </header>
        <ProfileSettings />
      </Card>

      {/* Cada bloque tiene su propia barra de guardar: el contenedor limita hasta dónde se pega. */}
      <div className="flex flex-col gap-space-xl">
        <AssistantSettingsPanel />
      </div>
      <div className="flex flex-col gap-space-xl">
        <KnowledgePanel />
      </div>
    </div>
  );
}
