# PSWE-08_Taller_Innovaci-n_Software_II

PSWE-08 Taller de Innovación en Software II

App: Colibri

**Colibri** es una plataforma web minimalista para PYMEs de Costa Rica. Centraliza los mensajes de WhatsApp Business, Instagram Direct y Facebook Messenger, ayuda a responder las consultas comunes y avisa de comentarios que pueden dañar la reputación del negocio. El diseño sigue los principios de Apple: claridad, foco y pocos clics.

> **Estado actual:** la aplicación ya funciona de punta a punta en modo desarrollo: inicio de sesión real contra el servidor, bandeja de mensajes de WhatsApp (con el número de prueba de Meta), respuestas desde el navegador y panel de Inicio. Quedan sin datos reales (se muestran como N/A) las respuestas automáticas, las alertas reputacionales y la salud de reputación.

---

## Contenido

1. [Requisitos](#1-requisitos)
2. [Instalación paso a paso](#2-instalación-paso-a-paso)
3. [Iniciar la aplicación](#3-iniciar-la-aplicación)
4. [Comandos disponibles](#4-comandos-disponibles)
5. [Estructura del proyecto](#5-estructura-del-proyecto)
6. [Configuración](#6-configuración)
7. [Compilar para producción](#7-compilar-para-producción)
8. [Calidad de código y Git](#8-calidad-de-código-y-git)
9. [Inicio de sesión](#9-inicio-de-sesión)
10. [Solución de problemas](#10-solución-de-problemas)
11. [Tecnologías](#11-tecnologías)
12. [Documentación](#12-documentación)

---

## 1. Requisitos

### Software

| Herramienta | Versión                                             | Para qué se usa                                        | Cómo comprobarla |
| ----------- | --------------------------------------------------- | ------------------------------------------------------ | ---------------- |
| **Git**     | Cualquier versión reciente                          | Descargar el proyecto y activar los hooks de calidad   | `git --version`  |
| **Node.js** | **20 o superior** (se recomienda la LTS actual, 22) | Ejecutar el servidor y las herramientas de compilación | `node -v`        |
| **pnpm**    | **10 o superior** (el proyecto fija la **10.28.0**) | Instalar dependencias y ejecutar los comandos          | `pnpm -v`        |

> El proyecto usa **pnpm**, no npm ni yarn. Si usas otro gestor, la instalación falla a propósito para evitar inconsistencias.

### Sistema y equipo

- **Sistema operativo:** Windows 10/11, macOS o Linux.
- **Navegador:** versión reciente de Chrome, Edge, Firefox o Safari.
- **Puertos libres:** `3000` (aplicación web) y `3001` (API).
- **Internet:** solo durante la instalación, para descargar las dependencias. Las fuentes y los íconos ya vienen incluidos en el proyecto.
- **Espacio en disco:** unos 500 MB, casi todo en `node_modules`.

> **Si trabajas dentro de OneDrive** (Windows): `node_modules` crea decenas de miles de archivos y OneDrive intentará sincronizarlos, lo que vuelve todo lento. Lo más cómodo es clonar el proyecto **fuera de OneDrive** (por ejemplo `C:\Proyectos\`) o excluir esa carpeta de la sincronización.

---

## 2. Instalación paso a paso

Los comandos funcionan igual en PowerShell (Windows), Terminal (macOS) y bash (Linux), salvo donde se indica.

### Paso 1. Instalar Git

Descárgalo de <https://git-scm.com/downloads> y acepta las opciones por defecto. Comprueba:

```bash
git --version
```

### Paso 2. Instalar Node.js

1. Entra a <https://nodejs.org> y descarga la versión **LTS**.
2. Ejecuta el instalador con las opciones por defecto.
3. **Cierra y vuelve a abrir la terminal** (si no, no reconoce el comando nuevo).
4. Comprueba:

```bash
node -v
```

Debe mostrar `v20.x.x` o superior. Si muestra una versión menor, actualiza Node antes de continuar.

### Paso 3. Instalar pnpm

```bash
npm install -g pnpm@10.28.0
```

Comprueba:

```bash
pnpm -v
```

Debe responder `10.28.0` (o una 10.x).

> **Alternativa con Corepack** (incluido en Node 20 a 24): `corepack enable` y luego `corepack prepare pnpm@10.28.0 --activate`. En Windows puede requerir abrir la terminal como administrador.

> **Windows, error "la ejecución de scripts está deshabilitada":** ejecuta una sola vez `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` en PowerShell y vuelve a intentarlo. También puedes usar el Símbolo del sistema (`cmd`), donde no ocurre.

### Paso 4. Descargar el proyecto

```bash
git clone https://github.com/amoramongeCenfo/PSWE-08_Taller_Innovaci-n_Software_II.git
cd PSWE-08_Taller_Innovaci-n_Software_II
```

### Paso 5. Instalar las dependencias

Desde la carpeta del proyecto:

```bash
pnpm install
```

Esto instala, en un solo paso, las dependencias del cliente, del servidor y de las herramientas de desarrollo. También **activa los hooks de Git** (ver [sección 8](#8-calidad-de-código-y-git)). Tarda entre uno y tres minutos la primera vez.

Debe terminar con una línea parecida a `Done in 12s` y sin errores. Se crea la carpeta `node_modules` (no se sube a Git).

### Paso 6. Configuración (opcional)

Para desarrollo **no necesitas configurar nada**: los valores por defecto ya funcionan. Si quieres cambiarlos, mira la [sección 6](#6-configuración).

---

## 3. Iniciar la aplicación

```bash
pnpm dev
```

Esto levanta a la vez el servidor y el cliente. Verás salidas con las etiquetas `[server]` y `[client]`. Está listo cuando aparecen mensajes como estos:

```text
[server] API escuchando en http://localhost:3001
[client] webpack ... compiled successfully
```

Luego:

1. Abre **<http://localhost:3000>** en el navegador.
2. Como aún no has iniciado sesión, te lleva a la pantalla de **Inicia sesión**.
3. Entra con la cuenta que definiste en `server/.env` (ver [Inicio de sesión](#9-inicio-de-sesión)).
4. Verás el marco de la aplicación con el menú lateral (Inicio, Mensajes, Alertas, Configuración).

### Comprobar que todo quedó bien

- [ ] `http://localhost:3000` muestra la pantalla de inicio de sesión con el logo del colibrí.
- [ ] Con las credenciales de prueba entras a **Inicio**.
- [ ] Al hacer clic en Mensajes, Alertas y Configuración cambia la pantalla.
- [ ] Con el servidor corriendo, la barra superior dice **Canales activos: WhatsApp** (si WhatsApp está configurado) y **Mensajes** lista las conversaciones recibidas.
- [ ] `http://localhost:3001/api/health` responde `{"status":"ok"}`.
- [ ] El botón de cerrar sesión (flecha, arriba a la derecha) te devuelve al inicio de sesión.

Para detener la aplicación, presiona **Ctrl + C** en la terminal.

---

## 4. Comandos disponibles

Se ejecutan desde la carpeta raíz del proyecto.

| Comando                                             | Qué hace                                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `pnpm dev`                                          | Inicia servidor (`:3001`) y cliente (`:3000`) con recarga automática                                    |
| `pnpm build`                                        | Compila cliente y servidor para producción                                                              |
| `pnpm typecheck`                                    | Revisa los tipos de TypeScript en cliente y servidor                                                    |
| `pnpm test`                                         | Ejecuta las pruebas automáticas del servidor                                                            |
| `pnpm --filter @colibri/server whatsapp:subscribe`  | Suscribe tu app de Meta a tu cuenta de WhatsApp (ver la guía)                                           |
| `pnpm --filter @colibri/server instagram:subscribe` | Suscribe tu app de Meta a tu cuenta de Instagram (ver la guía)                                          |
| `pnpm --filter @colibri/server messenger:subscribe` | Suscribe tu app de Meta a tu página de Facebook (ver la guía)                                           |
| `pnpm --filter @colibri/server onboarding:reset`    | Vuelve a mostrar la bienvenida de 3 pasos (`--todo` también borra los ajustes); luego recarga la página |
| `pnpm lint`                                         | Revisa el código con ESLint                                                                             |
| `pnpm lint:fix`                                     | Revisa y corrige automáticamente lo que se pueda                                                        |
| `pnpm format`                                       | Da formato a todos los archivos con Prettier                                                            |
| `pnpm format:check`                                 | Comprueba el formato sin modificar nada                                                                 |
| `pnpm --filter @colibri/client dev`                 | Inicia **solo** el cliente                                                                              |
| `pnpm --filter @colibri/server dev`                 | Inicia **solo** el servidor                                                                             |

---

## 5. Estructura del proyecto

Es un monorepo con dos paquetes (`client` y `server`) administrados por pnpm.

```text
.
├── docs/                        Documentación: arquitectura, decisiones, hoja de ruta, servidor, WhatsApp
├── client/                      Aplicación web (React + TypeScript + Webpack)
│   ├── public/                  HTML base y favicon
│   ├── src/
│   │   ├── app/                 App.tsx y router.tsx (rutas de la aplicación)
│   │   ├── assets/images/       Logo
│   │   ├── components/          Piezas reutilizables
│   │   │   └── ui/              Átomos: Button, Input, TextField, PasswordField,
│   │   │                        Checkbox, Alert, Card, Logo, Spinner, etc.
│   │   ├── features/auth/       Inicio de sesión: servicio (real y simulado), estado (slice), guardas de ruta
│   │   ├── features/business/   Datos del negocio: servicio y estado (slice)
│   │   ├── features/channels/   Estado de los canales: servicio y estado (slice)
│   │   ├── features/dashboard/  Pantalla Inicio: bienvenida, canales, indicadores, actividad reciente y atajos
│   │   ├── features/messages/   Pantalla Mensajes: bandeja, conversación y respuesta
│   │   ├── features/profile/    Pantalla Perfil: formulario de negocio y persona
│   │   ├── layouts/
│   │   │   ├── AppShell/        Marco con menú lateral y barra superior
│   │   │   └── AuthLayout/      Marco de pantallas públicas (login)
│   │   ├── lib/                 Utilidades (cookies, unir clases CSS, formato "N/A")
│   │   ├── pages/               Una pantalla por archivo
│   │   ├── store/               Estado global (Redux Toolkit) y hooks tipados
│   │   └── styles/global.css    Estilos globales y tokens de diseño (Tailwind)
│   ├── postcss.config.mjs
│   └── webpack.config.ts
├── server/                      API (Node.js + Express + TypeScript)
│   ├── config/                  Configuración por entorno (default.json, ...)
│   ├── .env.example             Plantilla de variables de entorno (copiar a .env)
│   └── src/                     app.ts, config.ts, index.ts, db/ (migraciones) y modules/ (whatsapp, conversations, channels)
├── .husky/                      Hooks de Git (pre-commit, pre-push)
├── eslint.config.mjs            Reglas de ESLint
├── tsconfig.base.json           Configuración TypeScript compartida
├── pnpm-workspace.yaml          Define los paquetes del monorepo
└── package.json                 Comandos y herramientas comunes
```

---

## 6. Configuración

### Servidor

Usa el paquete [`config`](https://www.npmjs.com/package/config). Los valores por defecto están en `server/config/default.json`:

```json
{
  "server": { "port": 3001 },
  "cors": { "origin": "http://localhost:3000" }
}
```

Se pueden sobrescribir con **variables de entorno**:

| Variable                                                                                             | Qué cambia                                                                                                      | Por defecto             |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `PORT`                                                                                               | Puerto de la API                                                                                                | `3001`                  |
| `CORS_ORIGIN`                                                                                        | Dirección web que puede llamar a la API                                                                         | `http://localhost:3000` |
| `AUTH_ADMIN_EMAIL`                                                                                   | Correo de la cuenta para iniciar sesión (se crea al arrancar)                                                   | vacío                   |
| `AUTH_ADMIN_PASSWORD`                                                                                | Contraseña de esa cuenta (mínimo 8 caracteres)                                                                  | vacío                   |
| `DATABASE_URL`                                                                                       | Dirección de PostgreSQL. Vacía = memoria (se pierde al reiniciar)                                               | vacío                   |
| `MESSENGER_VERIFY_TOKEN`, `MESSENGER_APP_SECRET`, `MESSENGER_PAGE_ACCESS_TOKEN`, `MESSENGER_PAGE_ID` | Facebook Messenger (ver [guía](docs/integracion-messenger.md))                                                  | vacío                   |
| `INSTAGRAM_VERIFY_TOKEN`, `INSTAGRAM_APP_SECRET`, `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_ACCOUNT_ID`   | Instagram Direct (ver [guía](docs/integracion-instagram.md))                                                    | vacío                   |
| `INSTAGRAM_SIMULATE`                                                                                 | `true` simula Instagram sin Meta, solo para presentaciones (ver [guía](docs/integracion-instagram.md))          | vacío                   |
| `WHATSAPP_VERIFY_TOKEN`                                                                              | Texto para verificar el webhook de Meta                                                                         | vacío                   |
| `WHATSAPP_APP_SECRET`                                                                                | Secreto de la app de Meta (valida la firma)                                                                     | vacío                   |
| `WHATSAPP_ACCESS_TOKEN`                                                                              | Token para enviar mensajes                                                                                      | vacío                   |
| `WHATSAPP_BUSINESS_ACCOUNT_ID`                                                                       | Identificador de la cuenta de WhatsApp Business (solo para `whatsapp:subscribe`)                                | vacío                   |
| `WHATSAPP_PHONE_NUMBER_ID`                                                                           | Identificador del número de WhatsApp                                                                            | vacío                   |
| `AUTOREPLY_MIN_CONFIDENCE`                                                                           | Confianza mínima del analizador (0 a 1) para que Colibri conteste solo ([guía](docs/analizador-de-mensajes.md)) | `0.7`                   |
| `AUTOREPLY_TIME_ZONE`                                                                                | Zona horaria del negocio para las respuestas de horario                                                         | `America/Costa_Rica`    |
| `GRAPH_API_VERSION`                                                                                  | Versión de la API de Meta                                                                                       | `v23.0`                 |

**Archivo `.env`:** para no escribir las variables cada vez, copia `server/.env.example` como `server/.env` y completa los valores (en Windows: `copy server\.env.example server\.env`). El servidor lo lee solo al iniciar. **Nunca subas `.env` a Git** (ya está ignorado) ni compartas sus valores. La base de datos también es opcional: sin `DATABASE_URL` las conversaciones se guardan en memoria; para usar PostgreSQL sigue [Servidor → Almacenamiento](docs/servidor.md#almacenamiento). WhatsApp es opcional: sin esas variables el servidor funciona y los canales aparecen como "no configurados". La guía para obtenerlas, paso a paso, está en el [Tutorial: Meta y WhatsApp](docs/tutorial-meta-whatsapp.md).

También puedes crear archivos por entorno (por ejemplo `server/config/production.json`), que se aplican sobre `default.json` según el valor de `NODE_ENV`. Estos archivos están en `.gitignore` para no subir datos privados.

> **Si cambias el puerto de la API**, cambia también el destino del proxy en `client/webpack.config.ts` (`devServer.proxy`, hoy `http://localhost:3001`). Si no, el cliente no encontrará la API.

### Cliente

- El servidor de desarrollo corre en el puerto `3000` (`devServer.port` en `client/webpack.config.ts`).
- Las llamadas a `/api/...` se reenvían automáticamente a la API, así que en el código del cliente se usan rutas relativas.
- Colores, tipografía, espacios, radios y sombras están definidos como tokens en `client/src/styles/global.css`, tomados del prototipo de Stitch.

---

## 7. Compilar para producción

```bash
pnpm build
```

| Resultado      | Contenido                                                                                            |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| `client/dist/` | Archivos estáticos (HTML, JS, CSS, fuentes, imágenes) listos para publicar en cualquier servidor web |
| `server/dist/` | API compilada a JavaScript                                                                           |

Para iniciar la API compilada:

```bash
pnpm --filter @colibri/server start
```

Notas:

- Durante el build puede aparecer **"compiled with 3 warnings"**. Son avisos de tamaño (la fuente de íconos pesa ~1 MB y el JS principal supera el límite recomendado). No impiden nada.
- El servidor **todavía no entrega los archivos del cliente**; hoy se publican por separado. Si se publican en un servidor web, hay que configurarlo para que cualquier ruta (por ejemplo `/mensajes`) devuelva `index.html`; si no, al recargar esas pantallas dará error 404.

---

## 8. Calidad de código y Git

Al ejecutar `pnpm install` se activan automáticamente estos hooks con [Husky](https://typicode.github.io/husky/):

| Momento      | Qué se ejecuta                                              | Si falla                                    |
| ------------ | ----------------------------------------------------------- | ------------------------------------------- |
| `git commit` | ESLint y Prettier solo sobre los archivos que vas a guardar | El commit se cancela y muestra qué corregir |
| `git push`   | `pnpm typecheck` y `pnpm test` en todo el proyecto          | El push se cancela                          |

Buenas prácticas del proyecto:

- TypeScript en modo estricto en cliente y servidor.
- Un `Button`, `Input`, etc. por archivo en `components/ui`; las pantallas y formularios solo los combinan.
- Textos de la interfaz en español claro, sin términos técnicos.
- Mensajes de commit cortos con prefijo, por ejemplo `feat: login con sesión` o `fix: ...`.

---

## 9. Inicio de sesión

El inicio de sesión es **real**: lo valida el servidor. Para poder entrar, define tu cuenta en `server/.env` (la contraseña debe tener **al menos 8 caracteres**):

```text
AUTH_ADMIN_EMAIL=tu-correo@ejemplo.com
AUTH_ADMIN_PASSWORD=una-clave-de-8-o-mas
```

Al iniciar `pnpm dev`, el servidor crea la cuenta si no existe y lo dice en la terminal (`Cuenta de acceso: se creó …`). Si cambias la contraseña en el archivo y reinicias, se actualiza y se cierran las sesiones abiertas. Sin esas variables nadie puede entrar.

- **Mantener sesión iniciada** (casilla): si está marcada, la sesión dura **30 días**. Si no, la cookie se borra al cerrar el navegador y el servidor la vence a las 12 horas.
- **La cookie de sesión** (`colibri_session`) la emite el servidor como `HttpOnly` y `SameSite=Lax`: el navegador la envía solo y ningún script de la página puede leerla. Contiene un código al azar; el servidor solo guarda su huella (hash) y no se puede deducir la contraseña de ella.
- **Contraseñas:** se guardan con `scrypt` y una sal propia; nunca en claro.
- **Intentos repetidos:** tras 20 intentos fallidos desde la misma dirección, el servidor pide esperar 15 minutos.
- **Sesión vencida:** si el servidor deja de reconocer tu sesión mientras usas la aplicación (venció, o el servidor se reinició con datos en memoria), la aplicación te lleva sola a la pantalla de inicio de sesión.
- **Rutas protegidas:** `/api/conversations` y `/api/channels` exigen sesión. El webhook de Meta no la necesita: se protege con la firma de cada mensaje. Las pruebas del servidor (`app.test.ts`) lo comprueban.
- **Trabajar sin servidor:** `mockAuthService` sigue en el código. Para usarlo, cambia el export al final de `client/src/features/auth/authService.ts` (credenciales del simulado: `demo@colibri.cr` / `colibri123`).
- **Conectar otro backend:** la aplicación solo habla con el contrato `client/src/features/auth/authService.ts`; los endpoints están descritos ahí.
- **Datos sin valor:** el usuario de prueba solo tiene correo; nombre, rol, nombre del negocio y región se muestran como **N/A** hasta que existan. No hay datos fijos en la interfaz.
- **Estado global (Redux Toolkit):** la sesión (`features/auth/authSlice.ts`) y los datos del negocio (`features/business/businessSlice.ts`) viven en el store (`client/src/store`). Cuando el backend entregue valores, la interfaz los toma sola: basta con implementar `BusinessService` (`features/business/businessService.ts`) y cambiar su export, igual que con la autenticación. Para probar con datos de ejemplo, edita `mockBusinessService.ts`.
- **Pantalla Perfil** (menú → Perfil, ruta `/configuracion/perfil`): captura nombre del negocio, dirección (opcional), nombre de la persona y puesto. Al guardar se actualizan los campos que mostraban N/A.
- **Mensajes y canales (API real):** la pantalla Mensajes (`features/messages`) y el estado de los canales (`features/channels`) hablan con el servidor mediante `fetch` (`lib/http.ts`); en desarrollo webpack reenvía `/api` al puerto 3001, así que el servidor debe estar corriendo. La lista se actualiza sola cada 8 segundos y la conversación abierta cada 5 (`hooks/usePolling.ts`). WhatsApp solo permite responder 24 horas después del último mensaje de la persona; pasado ese plazo, el cuadro de respuesta se reemplaza por un aviso.
- **Guardado centralizado:** todo se guarda en un solo punto, `ProfileService` (`features/profile/profileService.ts`), con una sola acción (`saveProfile`) que actualiza el store. Hoy lo implementa `httpProfileService` (`PUT /api/profile`), que guarda nombre y puesto en el usuario y nombre y dirección en el negocio, en PostgreSQL. Para trabajar sin servidor queda `mockProfileService` (cookie `colibri_profile`): basta cambiar el export al final de `profileService.ts`.
- Para agregar un área nueva: crea su slice en `features/<area>/` y regístralo en `store/index.ts`.

> **Antes de publicar el servidor en internet:** exige `https` (la cookie pasa a `Secure` sola cuando la conexión lo es), cambia la contraseña inicial y revisa la sección de seguridad de [Servidor](docs/servidor.md).

---

## 10. Solución de problemas

| Problema                                                      | Causa probable                                                    | Solución                                                                                                       |
| ------------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `pnpm` no se reconoce como comando                            | pnpm no está instalado o la terminal es anterior a la instalación | Repite el [Paso 3](#paso-3-instalar-pnpm) y abre una terminal nueva                                            |
| `node` no se reconoce                                         | Node no está instalado o la terminal es anterior a la instalación | Repite el [Paso 2](#paso-2-instalar-nodejs) y abre una terminal nueva                                          |
| `ERR_PNPM_UNSUPPORTED_ENGINE` al instalar                     | Node menor a 20 o pnpm menor a 10                                 | Actualiza Node y/o pnpm y comprueba con `node -v` y `pnpm -v`                                                  |
| "La ejecución de scripts está deshabilitada" (PowerShell)     | Política de ejecución de Windows                                  | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, o usa `cmd`                                             |
| `EADDRINUSE` o "port already in use"                          | Otro programa usa el puerto 3000 o 3001                           | Cierra ese programa. Para ver cuál (Windows): `netstat -ano \| findstr :3000`. En macOS/Linux: `lsof -i :3000` |
| `http://localhost:3000/api/...` devuelve error                | La API no está corriendo o usa otro puerto                        | Usa `pnpm dev` (levanta ambos) y revisa `http://localhost:3001/api/health`                                     |
| Error `Cannot find module ...`                                | Instalación incompleta o desactualizada                           | Borra `node_modules` y ejecuta `pnpm install` de nuevo                                                         |
| Los hooks de Git no se ejecutan                               | El proyecto se instaló antes de existir el repositorio Git        | Ejecuta `pnpm install` otra vez dentro del repositorio (o `pnpm exec husky`)                                   |
| El commit se cancela con errores de ESLint                    | El hook encontró problemas en tu código                           | Corrígelos según el mensaje, o prueba `pnpm lint:fix`                                                          |
| Instalación o `git` muy lentos en Windows                     | La carpeta está dentro de OneDrive                                | Mueve el proyecto fuera de OneDrive o excluye `node_modules` de la sincronización                              |
| Aviso de `LF will be replaced by CRLF` al usar Git en Windows | Diferencia de saltos de línea                                     | Es solo un aviso. El proyecto usa LF (ver `.editorconfig`)                                                     |
| Entras a `/login` y te redirige a Inicio                      | Ya tienes una sesión activa                                       | Es lo esperado. Cierra sesión con el botón de arriba a la derecha                                              |

Si el problema persiste, borra la carpeta `node_modules`, ejecuta `pnpm install` de nuevo y confirma que `node -v` y `pnpm -v` cumplan los [requisitos](#1-requisitos). No borres `pnpm-lock.yaml`: fija las versiones exactas de las dependencias.

---

## 11. Tecnologías

| Área                | Tecnología                                          |
| ------------------- | --------------------------------------------------- |
| Lenguaje            | TypeScript 5.9 (modo estricto)                      |
| Cliente             | React 19, React Router 8, Webpack 5, Tailwind CSS 4 |
| Estado global       | Redux Toolkit y React-Redux                         |
| Servidor            | Node.js, Express 5, `config`, zod, helmet           |
| Pruebas             | Vitest (servidor)                                   |
| Calidad             | ESLint 9, Prettier 3, Husky 9, lint-staged          |
| Gestor de paquetes  | pnpm 10 (monorepo con workspaces)                   |
| Tipografía e íconos | Inter y Material Symbols, incluidos localmente      |

---

## 12. Documentación

La carpeta [`docs/`](docs/README.md) explica cómo está hecho el proyecto y qué sigue:

| Documento                                                   | Contenido                                                                |
| ----------------------------------------------------------- | ------------------------------------------------------------------------ |
| [Arquitectura](docs/arquitectura.md)                        | Organización del código, estado global y servicios con contrato          |
| [Convenciones](docs/convenciones.md)                        | Reglas para escribir código nuevo y agregar pantallas                    |
| [Decisiones](docs/decisiones.md)                            | Qué se decidió y por qué                                                 |
| [Hoja de ruta](docs/hoja-de-ruta.md)                        | Etapas del proyecto y su estado                                          |
| [Servidor](docs/servidor.md)                                | Diseño del servidor, rutas, variables de entorno y seguridad             |
| [Tutorial: Meta y WhatsApp](docs/tutorial-meta-whatsapp.md) | Guía de cero: cuenta de desarrollador, número de prueba, túnel y webhook |
| [Integración con WhatsApp](docs/integracion-whatsapp.md)    | Referencia técnica de la integración y solución de problemas             |
