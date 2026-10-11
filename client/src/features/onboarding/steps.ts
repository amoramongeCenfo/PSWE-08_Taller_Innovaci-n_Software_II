export interface OnboardingStep {
  title: string;
  /** Título grande del panel principal. */
  heading: string;
  description: string;
}

/** Los tres pasos de la bienvenida, en orden. */
export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  {
    title: 'Conectar tus redes',
    heading: '¿Dónde te escriben tus clientes?',
    description:
      'Estas son las redes que Colibri atiende. Las conectadas ya muestran sus mensajes en la bandeja.',
  },
  {
    title: 'Qué contesta Colibri',
    heading: '¿Qué puede contestar Colibri solo?',
    description:
      'Elige para cada consulta si Colibri responde con la información de tu negocio, si te pide autorización primero o si tú te encargas.',
  },
  {
    title: 'Cómo habla tu negocio',
    heading: '¿Cómo le habla Colibri a tus clientes?',
    description:
      'Elige el estilo y el trato. Colibri escribirá así en todas sus respuestas, como lo harías tú.',
  },
];
