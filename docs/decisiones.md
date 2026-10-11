# Decisiones

Registro corto de decisiones. Formato: **qué se decidió**, por qué y qué se descartó.

## Producto

| Decisión                                                              | Por qué                                                                                               |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| El proyecto se llama **Colibri** (el PRD original decía ClaroPyme)    | Nombre definido por el equipo                                                                         |
| Es un proyecto de curso y **no saldrá de modo desarrollador de Meta** | No hace falta revisión de apps ni verificación de negocio; solo participan personas con rol en la app |
| El primer canal es **WhatsApp**                                       | Es el canal central del producto y Meta da un número de prueba gratuito                               |

## Técnicas

| Decisión                                                                                               | Por qué                                                                                     | Descartado                                    |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **pnpm** con workspaces                                                                                | Instalaciones rápidas y estrictas con las dependencias                                      | npm                                           |
| **TypeScript estricto** en cliente y servidor                                                          | Menos errores y mejor ayuda del editor                                                      | JavaScript                                    |
| **Webpack 5**                                                                                          | Requisito del equipo                                                                        | Vite                                          |
| **Tailwind CSS v4** con tokens de Stitch                                                               | Reproduce el prototipo y mantiene un solo sistema de diseño                                 | CSS a mano                                    |
| **Redux Toolkit** para estado global                                                                   | Estándar moderno, tipado y con acciones asíncronas integradas                               | Context API                                   |
| **Servicios con contrato** y versión simulada                                                          | Permite desarrollar sin backend y conectarlo cambiando una línea                            | Llamar a `fetch` desde los componentes        |
| Datos ausentes se muestran como **N/A**                                                                | Evita datos falsos fijos en pantalla                                                        | Datos de ejemplo permanentes                  |
| **Sesiones en el servidor** con un código al azar en cookie `HttpOnly`                                 | Se pueden revocar al instante y JavaScript no puede robar la cookie                         | JWT en `localStorage`                         |
| Contraseñas con **`scrypt`** de Node                                                                   | Viene incluido (sin dependencias) y es lento a propósito ante fuerza bruta                  | bcrypt, guardarlas en claro                   |
| Cuenta inicial por **variables de entorno**                                                            | Simple para un proyecto de curso: no hace falta pantalla de registro                        | Registro abierto                              |
| Sesión en cookie con **solo un token**                                                                 | Los datos de la persona no se quedan desactualizados                                        | Guardar el usuario completo en la cookie      |
| Perfil y negocio guardados en el servidor (`users.name/role`, tabla `business` de una sola fila)       | Un dato, un lugar; sobrevive a cambiar de navegador. Un negocio por instalación por ahora   | Cookie del navegador, multi-negocio desde ya  |
| Un solo `ProfileService` para guardar                                                                  | Lógica de guardado centralizada                                                             | Un guardado por cada área                     |
| Conversaciones detrás de `ConversationRepository`: **PostgreSQL** si hay `DATABASE_URL`, si no memoria | Los datos sobreviven al reinicio; sin base de datos todo sigue funcionando para desarrollar | SQLite, ORM completo                          |
| Driver **`pg`** con SQL a mano y migraciones propias (`db/migrations.ts`)                              | Pocas tablas; el SQL queda a la vista y no hay herramientas extra que aprender              | Prisma, TypeORM                               |
| Tokens de WhatsApp en **variables de entorno** (`server/.env`)                                         | Seguro y simple para un proyecto de curso; el navegador nunca los ve                        | Pantalla para guardar tokens en base de datos |
| **zod** para validar entradas del servidor                                                             | Valida y tipa a la vez                                                                      | Validación a mano                             |
| **helmet** y límite de peticiones                                                                      | Cabeceras de seguridad y protección básica contra abuso                                     | Nada                                          |
| **Vitest** para pruebas del servidor                                                                   | Rápido y entiende TypeScript sin configuración                                              | Jest                                          |
| Responder siempre **200** a eventos con firma válida                                                   | Evita que Meta reintente eventos que no usamos                                              | Responder error en eventos desconocidos       |
| **Husky + lint-staged**                                                                                | Evita subir código que no pasa lint, tipos o formato                                        | Revisión manual                               |
| "Contesta solo" depende de un **contrato `MessageAnalyzer`**                                           | El área de análisis trabaja aparte y se conecta cambiando una línea                         | Meter el análisis dentro del motor            |
| Respuestas automáticas con **plantillas editables** y variables                                        | El negocio controla qué se dice; si falta un dato, no se envía nada inventado               | Texto generado por IA sin revisión            |
| Los **reclamos nunca** se contestan solos                                                              | Una respuesta automática a una queja puede empeorar la situación                            | Respetar la regla elegida                     |
| El motor corre **aparte del webhook**, con una cola por conversación                                   | Meta recibe su 200 al instante y no salen dos respuestas al mismo turno                     | Responder dentro del webhook                  |

## Pendientes por decidir

- Cómo crear más cuentas (por ahora hay una sola, definida en `server/.env`) y si habrá roles.
- Cómo mostrar mensajes nuevos en la bandeja: consulta periódica o conexión en tiempo real.
