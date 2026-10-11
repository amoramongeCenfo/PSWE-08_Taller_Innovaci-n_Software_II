# Hoja de ruta

Estado: ✅ hecho · 🚧 en curso · ⏳ pendiente

## Etapa 1. Base del proyecto ✅

- ✅ Monorepo pnpm con cliente (React + Webpack) y servidor (Express + `config`)
- ✅ ESLint, Prettier, Husky y TypeScript estricto
- ✅ Estilos globales y tokens de diseño de Stitch
- ✅ README de instalación

## Etapa 2. Interfaz base ✅

- ✅ Marco con menú lateral y barra superior (AppShell)
- ✅ Inicio de sesión con "mantener sesión iniciada", guardas de ruta y servicio intercambiable
- ✅ Estado global con Redux Toolkit; datos ausentes como N/A
- ✅ Pantalla Perfil con guardado centralizado
- ✅ Bienvenida de Inicio (saludo, fecha, estado de canales)
- ✅ Cuatro indicadores en Inicio; "Mensajes pendientes" es real y los demás muestran N/A hasta que existan sus módulos
- ✅ Inicio completo: actividad reciente (real), salud de reputación (N/A por ahora) y acciones rápidas
- ✅ Bienvenida de 3 pasos al primer ingreso, editable después desde Configuración (reglas, temas prohibidos y tono guardados en la API)
- ✅ Pantalla "Próximamente" para las opciones que aún no están programadas
- ✅ Nuevo Inicio: acciones en los indicadores, logos de canales, consultas recientes con "Responder" y tiempo promedio de respuesta real
- ✅ Menú con Mi negocio (perfil + configuración) e Historial; menú del avatar; interruptor "Texto grande"
- ✅ Mensajes v2: búsqueda, orden por espera, filtro por canal, tiempo de espera real y estado de sincronización

## Etapa 3. Servidor y primera integración (WhatsApp) 🚧

Ver [Servidor](servidor.md) y [Integración con WhatsApp](integracion-whatsapp.md).

- ✅ Servidor: configuración, variables de entorno (`.env`) y estructura por módulos
- ✅ Webhook de WhatsApp: verificación y recepción de mensajes con firma
- ✅ Envío de respuestas por la API de WhatsApp (con control de la ventana de 24 horas)
- ✅ Almacenamiento de conversaciones y mensajes **en memoria** (detrás de una interfaz)
- ✅ Pruebas automáticas del servidor (Vitest)
- ✅ Probado con Meta de verdad: app, número de prueba, túnel y webhook ([guía](integracion-whatsapp.md))
- ✅ Cliente conectado a la API: servicios reales de conversaciones y canales
- ✅ Almacenamiento en **PostgreSQL** (opcional con `DATABASE_URL`; migraciones automáticas)
- ⏳ (Opcional) Pantalla para conectar el canal; por ahora el token va en `server/.env`
- ✅ Bandeja de Mensajes con conversaciones reales y respuesta manual (se actualiza sola cada pocos segundos)
- ✅ Estado real de "Canales activos" en Inicio y la barra superior

## Etapa 4. Respuestas asistidas ⏳

- ✅ Reglas por consulta (contesta solo / me pregunta / nunca), temas prohibidos y tono, guardados
- ✅ "Contesta solo": Colibri responde con la información del negocio y plantillas editables ([plan](plan-respuestas-automaticas.md))
- ⏳ Analizador de mensajes definitivo (área de análisis); hoy uno básico de palabras clave ([guía](analizador-de-mensajes.md))
- ⏳ Sugerencia de respuesta con IA, siempre aprobada por la persona (tarjeta "Colibri preparó esta respuesta" en Mensajes)
- ⏳ Resolver conversaciones y perfil del cliente

## Etapa 5. Alertas de reputación ⏳

- ⏳ Detección de mensajes con riesgo (quejas, enojo, palabras clave)
- 🚧 Pantalla de Alertas con prioridad y acción rápida: diseño listo, sin datos ni lógica

## Etapa 6. Más canales ⏳

- ⏳ Instagram Direct: código listo; Meta no entrega los mensajes reales con la app en modo desarrollador (pendiente publicar la app) — [guía](integracion-instagram.md)
- ✅ Facebook Messenger (recibir y responder texto) — [guía](integracion-messenger.md)

## Etapa 7. Autenticación real 🔄

- ✅ Login real con cookie `HttpOnly` emitida por el servidor, sesiones revocables y rutas protegidas
- ✅ La app vuelve sola al login si la sesión vence
- ⏳ Crear más cuentas (hoy una sola, desde `server/.env`) y roles
- ✅ Perfil y negocio guardados en la API (`PUT /api/profile`, `GET /api/business`)
