# Arquitectura

Colibri es un monorepo con dos paquetes administrados por pnpm: `client` (la aplicación web) y `server` (la API). Hoy el cliente funciona solo, con servicios simulados; el servidor está empezando (ver [Servidor](servidor.md)).

## Idea central: la interfaz no sabe de dónde vienen los datos

Toda la información entra a la aplicación por **servicios con un contrato** (una interfaz de TypeScript). Hoy cada contrato tiene una implementación simulada (`mock…`). Cuando exista el backend, se escribe una implementación real y se cambia **una sola línea** de exportación. La interfaz no se toca.

```text
Pantalla → Hook / Redux → Servicio (contrato) → mock hoy · backend real mañana
```

| Servicio          | Contrato                                 | Hoy (simulado)                        | Endpoint sugerido    |
| ----------------- | ---------------------------------------- | ------------------------------------- | -------------------- |
| Autenticación     | `features/auth/authService.ts`           | **API real** (`httpAuthService`)      | `/api/auth/*`        |
| Negocio (lectura) | `features/business/businessService.ts`   | **API real** (`httpBusinessService`)  | `GET /api/business`  |
| Asistente         | `features/assistant/assistantService.ts` | **API real** (`httpAssistantService`) | `/api/assistant`     |
| Info. del negocio | `features/knowledge/knowledgeService.ts` | **API real** (`httpKnowledgeService`) | `/api/knowledge`     |
| Perfil (guardar)  | `features/profile/profileService.ts`     | **API real** (`httpProfileService`)   | `PUT /api/profile`   |
| Canales           | `features/channels/channelService.ts`    | **API real** (`httpChannelService`)   | `GET /api/channels`  |
| Mensajes          | `features/messages/messageService.ts`    | **API real** (`httpMessageService`)   | `/api/conversations` |

Para conectar uno: crea la implementación real que cumpla el contrato y cambia el `export const xService = …` al final del archivo del contrato.

## Estructura del cliente

```text
client/src/
├── app/            App.tsx y router.tsx
├── components/     Piezas reutilizables sin lógica de negocio
│   └── ui/         Átomos: Button, Input, TextField, Card, Chip, …
├── features/       Una carpeta por área funcional (lógica + componentes propios)
│   ├── auth/       Sesión: servicio, slice, guardas de ruta, formulario de login
│   ├── business/   Datos del negocio: servicio y slice
│   ├── channels/   Estado de los canales (WhatsApp, …): servicio y slice
│   ├── dashboard/  Pantalla Inicio: bienvenida, canales, indicadores, actividad reciente y atajos
│   ├── messages/   Pantalla Mensajes: bandeja, conversación y respuesta
│   └── profile/    Pantalla Perfil: formulario y guardado centralizado
├── layouts/        Marcos de pantalla: AppShell (con menú) y AuthLayout (login)
├── lib/            Utilidades sin dependencias del negocio (cookies, cx, formato)
├── pages/          Una pantalla por archivo; solo componen features
├── store/          Estado global (Redux Toolkit) y hooks tipados
└── styles/         global.css con los tokens de diseño (Tailwind)
```

Regla de dependencias (de arriba hacia abajo, nunca al revés):
`pages` → `features` → `components/ui` → `lib`.
Una `feature` puede leer el store, pero no importa componentes de otra `feature` salvo por su `index.ts`.

## Estado global (Redux Toolkit)

- `store/index.ts` registra un slice por área: `auth` y `business`.
- Los datos que aún no existen son `null` o listas vacías, y la interfaz los muestra como **N/A** (`lib/format.ts`). No hay datos fijos en pantalla.
- **Acciones que tocan varias áreas** se definen una sola vez y cada slice las escucha. Ejemplo: `saveProfile` (en `features/profile`) actualiza `auth.user` y `business.profile` a la vez.
- Los componentes usan `useAppDispatch` y `useAppSelector` (`store/hooks.ts`), nunca los hooks sin tipos.

## Sesión

- La cookie `colibri_session` la emite el **servidor** (`HttpOnly`, `SameSite=Lax`) con un código al azar; el cliente nunca la lee. Los datos de la persona los entrega el servicio (`GET /api/auth/me`), así nunca quedan desactualizados.
- Con "mantener sesión iniciada" la sesión dura 30 días; si no, la cookie se borra al cerrar el navegador y el servidor la vence a las 12 horas.
- Si cualquier llamada recibe `401 UNAUTHENTICATED`, `lib/http.ts` avisa y `sessionExpired` (en `authSlice`) deja la app sin sesión; los demás slices se vacían y `RequireAuth` lleva al login.
- Rutas protegidas con `RequireAuth`; `RedirectIfAuthenticated` evita volver al login con sesión activa.
- Nombre y puesto viven en el usuario del servidor (`/api/auth/me` los devuelve); nombre y dirección del negocio, en la tabla `business`. Los mocks (`mockProfileService`, `mockBusinessService`, `mockAuthService`) quedan solo para trabajar sin servidor.

## Diseño visual

Los tokens (colores, tipografía, espacios, sombras) salen del prototipo de Stitch y viven en `client/src/styles/global.css` como `@theme` de Tailwind v4. Los componentes usan esos tokens; no se escriben colores a mano.

## Bienvenida y configuración del asistente

- La primera vez que alguien entra, `RequireOnboarding` (en `features/onboarding`) lo lleva a `/bienvenida`: tres pasos a pantalla completa (redes, qué contesta Colibri, cómo habla el negocio). Al terminar, o con "Configurar después", se guarda con `completeOnboarding: true` y ya no vuelve a aparecer.
- Los editores de cada paso viven en `features/assistant` y se reutilizan en **Configuración**, donde se pueden cambiar cuando se quiera.
- Para volver a mostrar la bienvenida (presentaciones, pruebas): `pnpm --filter @colibri/server onboarding:reset` conserva reglas, temas y tono; con `--todo` también vuelve a los valores iniciales. Luego se recarga la página. Sin `DATABASE_URL` basta con reiniciar el servidor.
- Las opciones que aún no existen (conectar un canal desde la app, planes, ayuda por WhatsApp, SINPE, feriados) llevan a la pantalla única `/proximamente?funcion=…` (`comingSoonPath`).
- El video de la bienvenida es de muestra: una cuenta regresiva generada para el proyecto (`assets/media`), sin derechos de terceros, hasta grabar el tutorial real.
- Los logos de los canales vienen del paquete `simple-icons` (licencia CC0) a través de `ChannelLogo`.

## Menú, Mi negocio y accesibilidad

- Menú lateral: Inicio, Mensajes (con el número de conversaciones que esperan respuesta, actualizado cada 30 s desde `AppShell`), Alertas, **Mi negocio** e **Historial** (todavía "Próximamente").
- **Mi negocio** (`/mi-negocio`) reúne lo que antes eran Perfil y Configuración, con anclas `#perfil`, `#redes`, `#que-contesta`, `#como-habla`, `#lo-que-sabe` y `#sabe-<tema>`. Las direcciones viejas (`/configuracion`, `/configuracion/perfil`) redirigen.
- El menú del avatar (arriba a la derecha) tiene "Mi negocio y perfil" y "Cerrar sesión".
- **Texto grande**: agranda la escala tipográfica redefiniendo las variables `--text-*` bajo `html.texto-grande` (ver `styles/global.css`). Es una preferencia de este navegador (`localStorage`), se aplica antes de pintar (`index.tsx`) y en móvil está dentro del menú del avatar.

## Inicio

- Datos reales: mensajes pendientes, canales conectados, consultas recientes, **respondidos solitos** y **tiempo promedio de respuesta** (`GET /api/conversations/stats`: `autoReplies` y el tiempo desde el primer mensaje de cada turno del cliente hasta la primera respuesta, últimos 7 días).
- En N/A hasta que existan sus módulos: atendidos fuera de horario, alertas importantes y opinión de tus clientes. Sus acciones llevan a "Próximamente" o a Alertas.

## Respuestas automáticas ("Contesta solo")

```text
Webhook ─► ConversationService.receive ─► guarda el mensaje
                                       └► oyentes (aparte, sin demorar la respuesta a Meta)
                                            └► AutoReplyService (una cola por conversación)
                                                 ├► MessageAnalyzer (contrato del área de análisis)
                                                 ├► reglas y pausa (AssistantRepository)
                                                 ├► ReplyComposer (información del negocio + plantillas)
                                                 └► ConversationService.reply(…, 'colibri')
```

- **Información del negocio** (`server/src/modules/knowledge`): horario por día, ubicación, precios y pagos (SINPE Móvil), envíos, disponibilidad, encargos y plantillas personalizadas. Una fila JSON en `business_knowledge` (migración `006_auto_replies`).
- **Plantillas** (`server/src/modules/autoreply/templates.ts`): una de fábrica por tema según el tono y el trato, con variables como `{horario_hoy}`, `{direccion}` o `{sinpe}`. Las opcionales vacías desaparecen; si falta una obligatoria, ese tema no se contesta solo. El horario se arma con la hora de Costa Rica (`hours.ts`).
- **Analizador**: ver [Guía del analizador](analizador-de-mensajes.md). Hoy se usa el básico de palabras clave.
- **Quién escribió**: cada mensaje guarda `author` (`customer`, `person` o `colibri`); en Mensajes las de Colibri llevan "Respondido solito".
- **Pantalla**: Mi negocio › "Lo que Colibri sabe de tu negocio" (`features/knowledge`) con vista previa en vivo (`POST /api/knowledge/preview`), "Restaurar plantilla original", el interruptor "Pausar respuestas automáticas" y avisos en "Qué contesta Colibri" cuando falta información.

## Mensajes (v2)

- La bandeja ocupa toda el área de contenido: lista a la izquierda y conversación a la derecha (en móvil, una a la vez).
- Lista: búsqueda (nombre, número o mensaje, sin importar tildes), orden "Más recientes" o "Más tiempo esperando", filtro por canal, y estado de cada conversación ("Esperando 2 h" en rojo desde una hora, ámbar antes; "Respondido"). Al pie: cuántas se ven y si la última actualización con el servidor funcionó.
- "Esperando" se mide desde el **primer** mensaje de la persona después de nuestra última respuesta: el servidor lo guarda en `awaitingSince` (migración `005_conversation_awaiting_since`, que también calcula el dato para las conversaciones existentes).
- Conversación: cabecera con canal y número, burbujas con hora y estado de entrega ("Enviado", "Entregado", "Leído"). "Ver perfil del cliente" y "Resolver conversación" llevan a "Próximamente".
- Pendiente de la etapa 4: la respuesta sugerida por Colibri ("Aprobar y enviar") y las opciones rápidas.

## Alertas (solo diseño)

- La pantalla de Alertas está construida con componentes reales en `features/alerts` (tarjeta de alerta, nivel de riesgo, comentario, hilo, respuesta sugerida, acciones, pestañas Nuevas/Historial y panel "¿Qué considero riesgo alto?"), pero **sin lógica ni datos**: cada sección muestra su aviso de "sin datos" y los controles aparecen bloqueados.
- El contrato de datos está en `features/alerts/types.ts` (`ReputationAlert`, `AlertSettings`). Para conectar la detección (etapa 5): pasar las alertas reales a `AlertList` y los ajustes a `RiskSettingsPanel`, y dar manejadores a `AlertActions`, `KeywordList` y `WhatsAppAlertToggle` (sin manejador, se muestran bloqueados).
