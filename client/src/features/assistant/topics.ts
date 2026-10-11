import type { ReplyMode, TopicId } from './types';

interface TopicInfo {
  title: string;
  description: string;
  /** Ícono de Material Symbols. */
  icon: string;
}

/** Consultas comunes de un negocio en Costa Rica, en el orden de la pantalla. */
export const TOPICS: Record<TopicId, TopicInfo> = {
  hours: {
    title: 'Horario de atención',
    description: 'Apertura, cierre, fines de semana y feriados.',
    icon: 'schedule',
  },
  location: {
    title: 'Ubicación y señas',
    description: 'Dirección exacta, señas y enlaces a Waze o Google Maps.',
    icon: 'location_on',
  },
  pricing: {
    title: 'Precios y métodos de pago',
    description: 'Tarifas, precios de productos y número de SINPE Móvil.',
    icon: 'payments',
  },
  availability: {
    title: 'Disponibilidad de productos',
    description: 'Existencias del día y productos que se hacen por encargo.',
    icon: 'inventory_2',
  },
  shipping: {
    title: 'Envíos y encomiendas',
    description: 'Entregas en el GAM, Correos de Costa Rica o mensajería privada.',
    icon: 'local_shipping',
  },
  orders: {
    title: 'Encargos y pedidos especiales',
    description: 'Pedidos personalizados, regalos y apartados.',
    icon: 'shopping_bag',
  },
  complaints: {
    title: 'Reclamos y comentarios delicados',
    description: 'Molestias de clientes que conviene atender en persona.',
    icon: 'report',
  },
};

export const REPLY_MODE_OPTIONS: { value: ReplyMode; label: string; hint: string }[] = [
  { value: 'auto', label: 'Contesta solo', hint: 'Colibri responde con los datos de tu negocio.' },
  {
    value: 'ask',
    label: 'Me pregunta',
    hint: 'Colibri prepara la respuesta y espera tu visto bueno.',
  },
  { value: 'never', label: 'Nunca', hint: 'Colibri no contesta; tú te encargas.' },
];
