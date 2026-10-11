# Servidor

Servidor de Colibri: Node.js + Express 5 + TypeScript. Recibe los mensajes de WhatsApp, guarda las conversaciones y permite responder.

## Estado

| Pieza                                                                  | Estado                                     |
| ---------------------------------------------------------------------- | ------------------------------------------ |
| Configuración, `.env`, helmet, límite de peticiones, manejo de errores | ✅ Hecho                                   |
| Webhook de WhatsApp (verificación y mensajes firmados)                 | ✅ Hecho                                   |
| Envío de respuestas con control de la ventana de 24 horas              | ✅ Hecho                                   |
| Conversaciones y mensajes **en memoria**                               | ✅ Hecho                                   |
| Pruebas automáticas (46)                                               | ✅ Hecho                                   |
| Probado contra Meta real                                               | ⏳ Falta ([guía](integracion-whatsapp.md)) |
| Autenticación de la API del cliente (usuarios y sesiones)              | ✅ Hecho                                   |
| PostgreSQL (con migraciones automáticas)                               | ✅ Hecho                                   |

## Estructura

```text
server/src/
├── index.ts                 Ensambla las piezas y arranca (elige memoria o PostgreSQL)
├── app.ts                   Express: seguridad, rutas y errores
├── config.ts                Configuración tipada
├── env.ts                   Carga server/.env (debe importarse primero)
├── lib/httpError.ts         Error con código HTTP y mensaje claro
└── modules/
    ├── channels/            Estado de los canales
    ├── conversations/       Tipos, servicio, repositorio (interfaz, memoria y PostgreSQL) y rutas
    └── whatsapp/            Firma, traducción del formato de Meta, cliente de envío y webhook
```

Cada módulo tiene su carpeta. Un canal nuevo (Messenger, Instagram) será otra carpeta que traduce su formato al de Colibri y reutiliza `conversations`.

## Rutas

| Método | Ruta                              | Qué hace                                                                                  | Quién la llama |
| ------ | --------------------------------- | ----------------------------------------------------------------------------------------- | -------------- |
| GET    | `/api/health`                     | Comprueba que el servidor responde                                                        | Cualquiera     |
| GET    | `/api/webhooks/messenger`         | Verificación del webhook de Messenger                                                     | Meta           |
| POST   | `/api/webhooks/messenger`         | Recibe mensajes y entregas de Messenger (exige firma válida)                              | Meta           |
| GET    | `/api/webhooks/instagram`         | Verificación del webhook de Instagram                                                     | Meta           |
| POST   | `/api/webhooks/instagram`         | Recibe mensajes y lecturas de Instagram (exige firma válida)                              | Meta           |
| GET    | `/api/webhooks/whatsapp`          | Verificación del webhook (devuelve el reto de Meta)                                       | Meta           |
| POST   | `/api/webhooks/whatsapp`          | Recibe mensajes y estados de entrega (exige firma válida)                                 | Meta           |
| POST   | `/api/auth/login`                 | Inicia sesión `{ email, password, rememberMe }` y envía la cookie                         | Cliente        |
| GET    | `/api/auth/me`                    | Persona con la sesión actual, o 401                                                       | Cliente        |
| POST   | `/api/auth/logout`                | Cierra la sesión y borra la cookie                                                        | Cliente        |
| GET    | `/api/channels`                   | Estado de los canales: `active` o `not_configured` (**exige sesión**)                     | Cliente        |
| GET    | `/api/assistant`                  | Reglas, temas prohibidos, tono y si la bienvenida se completó                             | Cliente        |
| PUT    | `/api/assistant`                  | Guarda esos ajustes (`completeOnboarding: true` al terminar la bienvenida)                | Cliente        |
| GET    | `/api/knowledge`                  | Información del negocio y, por tema, la plantilla en uso, la de fábrica y su vista previa | Cliente        |
| PUT    | `/api/knowledge`                  | Guarda la información y las plantillas personalizadas (rechaza datos que no existen)      | Cliente        |
| POST   | `/api/knowledge/preview`          | Arma una plantilla `{ template, knowledge? }` con un borrador sin guardarlo               | Cliente        |
| GET    | `/api/business`                   | Datos del negocio `{ name, region, address }` (null si no hay dato)                       | Cliente        |
| PUT    | `/api/profile`                    | Guarda `{ user: { name, role }, business: { name, address } }`                            | Cliente        |
| GET    | `/api/conversations/stats`        | Últimos 7 días: tiempo promedio de respuesta y respuestas automáticas (`autoReplies`)     | Cliente        |
| GET    | `/api/conversations`              | Conversaciones, la más reciente primero                                                   | Cliente        |
| GET    | `/api/conversations/:id/messages` | Mensajes de una conversación                                                              | Cliente        |
| POST   | `/api/conversations/:id/messages` | Envía una respuesta `{ "text": "..." }` (1 a 4096 caracteres)                             | Cliente        |

Todas las respuestas de error tienen la forma `{ "code": "...", "message": "..." }`, con el mensaje en español listo para mostrar.

| Código                   | HTTP | Cuándo                                                        |
| ------------------------ | ---- | ------------------------------------------------------------- |
| `VERIFICATION_FAILED`    | 403  | El token de verificación del webhook no coincide              |
| `INVALID_SIGNATURE`      | 401  | El POST no viene firmado por Meta                             |
| `CHANNEL_NOT_CONFIGURED` | 503  | Faltan variables de WhatsApp                                  |
| `CONVERSATION_NOT_FOUND` | 404  | La conversación no existe                                     |
| `INVALID_MESSAGE`        | 400  | El texto está vacío o es demasiado largo                      |
| `REPLY_WINDOW_EXPIRED`   | 409  | Pasaron más de 24 horas desde el último mensaje de la persona |
| `CHANNEL_SEND_FAILED`    | 502  | Meta rechazó o no respondió al enviar                         |

El cliente ya no simula ninguna ruta: todo pasa por la API.

## Configuración

Valores por defecto en `server/config/default.json`; las variables de entorno los sobrescriben (`custom-environment-variables.json`). Copia `server/.env.example` como `server/.env` para definirlas. La lista completa de variables está en el [README](../README.md#6-configuración).

## Seguridad

- **Firma de Meta:** cada POST se valida con HMAC-SHA256 sobre el cuerpo sin modificar y `crypto.timingSafeEqual`. Sin firma válida, 401 y no se guarda nada.
- **Secretos:** solo en `server/.env` (ignorado por Git). No se escriben en logs ni en respuestas; las pruebas verifican que no se filtran.
- **Idempotencia:** el id del mensaje (`wamid…`) evita duplicados cuando Meta reintenta.
- **Estados que no retroceden:** un mensaje "leído" no vuelve a "enviado" si llegan avisos desordenados.
- **Validación:** el cuerpo del webhook y los textos del cliente se validan con zod; los desconocidos se ignoran.
- **Cabeceras y límites:** `helmet`, cuerpo máximo de 100 KB y 600 peticiones por minuto por IP.
- **CORS:** solo el origen del cliente.
- **Sesión obligatoria:** `/api/channels`, `/api/conversations`, `/api/business`, `/api/profile`, `/api/assistant` y `/api/knowledge` responden `401 UNAUTHENTICATED` sin una sesión válida. El webhook queda abierto porque lo protege la firma.
- **Contraseñas:** `scrypt` de Node con sal propia y comparación en tiempo constante. Un correo que no existe tarda lo mismo que uno con la contraseña mala y da el mismo mensaje, para no revelar qué cuentas existen.
- **Sesiones:** el servidor guarda solo el hash (SHA-256) de un token de 32 bytes al azar; si se filtrara la base de datos, esos hashes no sirven como cookie. Se pueden revocar (cerrar sesión, o cambiar la contraseña, cierra las sesiones).
- **Cookie:** `HttpOnly`, `SameSite=Lax` y `Secure` cuando la conexión es https. `SameSite=Lax` evita que otros sitios hagan peticiones con tu sesión (CSRF) y la API solo acepta JSON.
- **Intentos repetidos:** 20 intentos fallidos de inicio de sesión por dirección cada 15 minutos.

## Cuentas y sesiones

La cuenta para entrar se define en `server/.env` (`AUTH_ADMIN_EMAIL`, `AUTH_ADMIN_PASSWORD`, mínimo 8 caracteres) y se crea al arrancar si no existe. Si cambias la contraseña del archivo y reinicias, se actualiza y se cierran las sesiones abiertas. Con PostgreSQL, las tablas `users` y `sessions` las crea la migración `002_users_and_sessions` y la tabla `business` (nombre, región, dirección) la crea `003_business`; sin base de datos viven en memoria, igual que las conversaciones.

Código en `src/modules/auth/`: `password.ts` (hash), `authService.ts` (reglas), `authRepository.ts` (contrato, con versión en memoria y PostgreSQL), `authRoutes.ts` y `requireAuth.ts`. Pendiente: pantalla para crear más cuentas y roles.

## Almacenamiento

`ConversationRepository` es la interfaz y tiene dos implementaciones. Se elige al arrancar, según `DATABASE_URL`:

| `DATABASE_URL` | Implementación                   | Datos                           |
| -------------- | -------------------------------- | ------------------------------- |
| Vacía          | `MemoryConversationRepository`   | Se pierden al reiniciar         |
| Con valor      | `PostgresConversationRepository` | Se guardan en PostgreSQL (`pg`) |

Al iniciar, el servidor dice cuál usa: `Almacenamiento: PostgreSQL (…)` o `Almacenamiento: memoria (…)`. Si `DATABASE_URL` es incorrecta o PostgreSQL está apagado, no arranca y lo explica (por ejemplo `connect ECONNREFUSED`).

### Usar PostgreSQL en tu computadora

1. Crea una base vacía llamada `colibri`. Con la terminal de SQL (`psql`): `CREATE DATABASE colibri;`. También sirve el botón derecho en **Databases → Create → Database** de pgAdmin.
2. En `server/.env` escribe la línea con tu usuario y clave de PostgreSQL: `DATABASE_URL=postgresql://postgres:TU_CLAVE@localhost:5432/colibri`. Si la clave tiene símbolos (`@`, `#`, `/`), cámbialos por su código (por ejemplo `@` es `%40`).
3. Reinicia `pnpm dev`. La primera vez crea las tablas solo.

### Cómo cambia el esquema

Las tablas se definen en `src/db/migrations.ts` como una lista ordenada. Al iniciar, `runMigrations` aplica solo las que faltan y anota cada una en la tabla `schema_migrations`; cada migración corre en una transacción. **Una migración ya aplicada no se edita:** para cambiar algo se agrega otra al final de la lista.

| Tabla           | Qué guarda                                                                                     |
| --------------- | ---------------------------------------------------------------------------------------------- |
| `conversations` | Una por persona y canal (`UNIQUE (channel, contact_id)`), con resumen y fecha del último aviso |
| `messages`      | Mensajes; `UNIQUE (channel, external_id)` evita duplicados cuando Meta repite un evento        |

## Pruebas

`pnpm test` (corre también antes de cada `git push`). Cubren:

- Firma: correcta, otro secreto, cuerpo alterado, formatos raros.
- Traducción de mensajes y estados de Meta.
- Repositorio: sin duplicados, orden y estados. Las mismas pruebas (`conversationRepository.contract.ts`) se ejecutan sobre la versión en memoria y sobre PostgreSQL.
- Servicio: ventana de 24 horas y traducción de errores del canal.
- Cliente de Meta: petición correcta, código de ventana vencida, sin token y sin red.
- HTTP completo: verificación del webhook, mensajes firmados, firma inválida, responder y errores.

**Pruebas con PostgreSQL:** se omiten salvo que definas `TEST_DATABASE_URL` (misma forma que `DATABASE_URL`). Cada ejecución crea un esquema temporal con nombre aleatorio y lo borra al terminar, así que **no toca tus tablas**. En PowerShell: `$env:TEST_DATABASE_URL="postgresql://postgres:TU_CLAVE@localhost:5432/colibri"; pnpm test`.

La integración con Meta ya se probó de verdad: ver [Integración con WhatsApp](integracion-whatsapp.md).
