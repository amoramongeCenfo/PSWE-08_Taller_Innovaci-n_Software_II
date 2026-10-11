# Tutorial: de cero a recibir mensajes de WhatsApp en Colibri

Guía paso a paso, pensada para hacerla una sola vez y de corrido. Al terminar, un mensaje escrito desde tu teléfono aparece en la pantalla **Mensajes** de Colibri y puedes responderlo desde ahí.

- **Tiempo:** unos 30 a 45 minutos.
- **Qué necesitas:** una cuenta personal de Facebook, tu teléfono con WhatsApp, Colibri corriendo en tu computadora (`pnpm install` y `pnpm dev` ya funcionan) y un túnel público gratuito (se explica en el paso 8).
- **Costo:** ninguno. Todo se hace en **modo desarrollador** con el número de prueba gratuito de Meta, que es suficiente para un proyecto de curso: no pide revisión de la app ni verificar un negocio.

> Meta cambia nombres de menús con frecuencia. Si un botón no está donde dice la guía, busca el nombre parecido; las ideas son las mismas. Esta guía complementa a [Integración con WhatsApp](integracion-whatsapp.md), que explica cómo funciona por dentro.

## Los datos que vas a reunir

Ve anotándolos en un bloc de notas aparte (no en el chat ni en capturas de pantalla). Al final los pasas a `server/.env`.

| Dato                                            | Dónde se obtiene | Variable de `server/.env`      | ¿Es secreto?                              |
| ----------------------------------------------- | ---------------- | ------------------------------ | ----------------------------------------- |
| Identificador del número de teléfono            | Paso 3           | `WHATSAPP_PHONE_NUMBER_ID`     | No                                        |
| Identificador de la cuenta de WhatsApp Business | Paso 3           | `WHATSAPP_BUSINESS_ACCOUNT_ID` | No                                        |
| Clave secreta de la app                         | Paso 5           | `WHATSAPP_APP_SECRET`          | **Sí**                                    |
| Token de acceso                                 | Paso 6           | `WHATSAPP_ACCESS_TOKEN`        | **Sí**                                    |
| Texto de verificación (lo inventas tú)          | Paso 7           | `WHATSAPP_VERIFY_TOKEN`        | Es una contraseña simple, no lo compartas |

> **Ojo con los dos identificadores.** El del _número de teléfono_ y el de la _cuenta de WhatsApp Business_ se parecen (son números largos) y viven uno junto al otro. Se confunden fácil. Si pegas uno donde va el otro, nada funciona y el error no lo dice claro. Copia cada uno mirando su etiqueta.

---

## Parte 1. Cuenta y app en Meta

### Paso 1. Crear la cuenta de desarrollador

1. Entra a [developers.facebook.com](https://developers.facebook.com) e inicia sesión con tu cuenta personal de Facebook.
2. Pulsa **Comenzar** (_Get Started_) y acepta los términos.
3. Si te lo pide, verifica tu cuenta con el correo o el teléfono.
4. Elige tu rol (por ejemplo _Desarrollador_). Al terminar entras al panel de desarrolladores.

✅ **Listo cuando:** ves el panel con el botón **Crear app** y el menú **Mis apps**.

### Paso 2. Crear la app

1. Pulsa **Crear app**.
2. Escribe un nombre, por ejemplo `Colibri Dev`, y tu correo de contacto.
3. En los casos de uso, elige **Conectar con los clientes a través de WhatsApp** (_Connect with customers through WhatsApp_).
4. Si te pide un portafolio de negocio, elige **Aún no quiero conectar un portafolio** o deja que cree uno de prueba.
5. Revisa y pulsa **Crear app**. Puede pedirte tu contraseña de Facebook.

✅ **Listo cuando:** estás en el panel de tu app y el menú izquierdo tiene **Casos de uso** (_Use cases_).

---

## Parte 2. El número de prueba

### Paso 3. Abrir la configuración de la API y anotar los identificadores

1. En el panel de la app, ve a **Casos de uso** → junto a _Conectar con los clientes a través de WhatsApp_, pulsa **Personalizar**.
2. Abre **Configuración de la API** (_API Setup_). Meta ya creó por ti un **número de prueba** y una **cuenta de WhatsApp Business de prueba**.
3. En el paso 1 de esa pantalla, anota:
   - **Identificador del número de teléfono** (_Phone number ID_) → `WHATSAPP_PHONE_NUMBER_ID`
   - **Identificador de la cuenta de WhatsApp Business** (_WhatsApp Business Account ID_) → `WHATSAPP_BUSINESS_ACCOUNT_ID`

✅ **Listo cuando:** tienes anotados dos números largos, cada uno con su etiqueta.

### Paso 4. Registrar tu teléfono y probar el envío

El número de prueba solo puede hablar con teléfonos que tú registres (hasta 5).

1. En el campo **Para** (_To_), pulsa **Gestionar lista de números de teléfono** y agrega tu número con el código de país (Costa Rica: `+506`).
2. Meta te manda un código por WhatsApp. Escríbelo para verificar el número.
3. Selecciona tu número en **Para** y pulsa **Enviar mensaje** con la plantilla `hello_world`.
4. Debe llegarte a WhatsApp un mensaje de _Test Number_.
5. **Responde algo** desde tu teléfono (por ejemplo "hola"). Esto abre la **ventana de 24 horas**: WhatsApp solo deja a un negocio responder con texto libre durante las 24 horas siguientes al último mensaje de la persona.

✅ **Listo cuando:** recibiste el `hello_world` en tu teléfono.

---

## Parte 3. Secretos y token

### Paso 5. Clave secreta de la app

1. En el panel: **Configuración de la app** → **Básica** (_App settings_ → _Basic_).
2. En **Clave secreta de la app** (_App secret_) pulsa **Mostrar** y anótala → `WHATSAPP_APP_SECRET`.

Colibri la usa para comprobar que cada mensaje que llega viene realmente de Meta (firma del mensaje). **No la compartas.**

### Paso 6. Token de acceso

1. Vuelve a **Configuración de la API** (paso 3).
2. Pulsa **Generar token de acceso** y cópialo → `WHATSAPP_ACCESS_TOKEN`.

> Este token es **temporal: dura unas 24 horas**. Sirve para el desarrollo de hoy. Cuando venza, el envío falla con un error de token expirado (código 190); se renueva repitiendo este paso (ver "Qué hacer cada día", más abajo). Para uno permanente, ver "Token permanente" al final.

---

## Parte 4. Conectar Colibri

### Paso 7. Completar `server/.env`

1. Si no existe, copia `server/.env.example` como `server/.env` (en Windows: `copy server\.env.example server\.env`).
2. Complétalo con tus datos. El texto de verificación lo **inventas tú**: cualquier texto sin espacios, por ejemplo `colibri-verify-2026`.

```text
AUTH_ADMIN_EMAIL=tu-correo@ejemplo.com       (tu cuenta para entrar a Colibri)
AUTH_ADMIN_PASSWORD=una-clave-de-8-o-mas
WHATSAPP_VERIFY_TOKEN=colibri-verify-2026
WHATSAPP_APP_SECRET=...
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_BUSINESS_ACCOUNT_ID=...
```

3. Reinicia el servidor: `Ctrl + C` y luego `pnpm dev`.
4. Abre `http://localhost:3001/api/channels`. Debe responder:

```json
[{ "id": "whatsapp", "name": "WhatsApp", "state": "active" }]
```

Si dice `"not_configured"`, falta alguna variable o no se leyó el archivo (revisa que se llame `.env` y esté dentro de `server/`).

> `server/.env` está ignorado por Git a propósito. **Nunca lo subas ni lo compartas.**

✅ **Listo cuando:** `/api/channels` muestra `"state": "active"`.

### Paso 8. Abrir un túnel público

Meta necesita una dirección pública `https` para enviar los mensajes a tu computadora. Un túnel la crea de forma temporal y la conecta a tu puerto 3001.

**Opción A: Cloudflare (sin cuenta)**

1. Instala la herramienta. En Windows: `winget install --id Cloudflare.cloudflared` (cierra y abre la terminal después).
2. Con el servidor corriendo, en **otra** terminal: `cloudflared tunnel --url http://localhost:3001`
3. Copia la dirección que aparece, parecida a `https://algo-aleatorio.trycloudflare.com`.

**Opción B: ngrok (pide cuenta gratuita)**

1. Instala y configura [ngrok](https://ngrok.com) siguiendo su guía.
2. En otra terminal: `ngrok http 3001`
3. Copia la dirección `https://….ngrok-free.app`.

Comprueba que el túnel llega a tu servidor: abre en el navegador `https://TU-DIRECCION/api/health`. Debe mostrar `{"status":"ok"}`.

> **Seguridad:** mientras el túnel está abierto, tu servidor es alcanzable desde internet. Por eso la API exige iniciar sesión (solo el webhook de Meta queda abierto, protegido por su firma). Usa una contraseña de verdad en `AUTH_ADMIN_PASSWORD` y cierra el túnel cuando no lo uses.

> **La dirección cambia cada vez que reinicias el túnel.** Si la cierras, hay que repetir el paso 9 con la nueva. Deja esa terminal abierta mientras pruebas.

✅ **Listo cuando:** `https://TU-DIRECCION/api/health` responde `ok`.

### Paso 9. Registrar el webhook en Meta

El _webhook_ es la dirección a la que Meta avisa cuando llega un mensaje.

1. En el panel de la app, abre **Casos de uso** → **Personalizar** → **Configuración** (_Configuration_). Si usas el menú clásico, es **WhatsApp** → **Configuración** → **Webhook**.
2. En **Webhook** pulsa **Editar**.
3. **URL de devolución de llamada:** `https://TU-DIRECCION/api/webhooks/whatsapp`
4. **Token de verificación:** el mismo texto que pusiste en `WHATSAPP_VERIFY_TOKEN`.
5. Pulsa **Verificar y guardar**.
6. En **Campos del webhook** (_Webhook fields_), busca **`messages`** y pulsa **Suscribirse** (su interruptor debe quedar activo).

En la terminal del servidor aparece: `WhatsApp webhook: verificación correcta`.

Si Meta dice que no pudo verificar: revisa que el servidor y el túnel estén corriendo, que la dirección termine en `/api/webhooks/whatsapp` y que el token sea idéntico (cuidado con espacios).

✅ **Listo cuando:** Meta guardó el webhook y `messages` está suscrito.

### Paso 10. Suscribir la app a la cuenta de WhatsApp

Este paso evita el problema más confuso de todo el proceso: el botón **Probar** (_Test_) de Meta llega al servidor, pero los mensajes reales de tu teléfono no. Pasa porque configurar el webhook no siempre suscribe tu app a la cuenta de WhatsApp Business.

1. Confirma que `WHATSAPP_BUSINESS_ACCOUNT_ID` está en `server/.env` (paso 3).
2. En la raíz del proyecto ejecuta:

```bash
pnpm --filter @colibri/server whatsapp:subscribe
```

3. Debe mostrar dos listas. En la segunda, después de "Suscripción enviada", tiene que aparecer tu app (por ejemplo `Colibri Dev`).

Si da un error de token, es el temporal vencido: genera otro (paso 6), actualiza `server/.env` y reinicia.

✅ **Listo cuando:** tu app aparece en la lista final.

---

## Parte 5. Probar de punta a punta

1. **Recibir.** Desde tu teléfono, escribe al **número de prueba** de Meta (el que aparece como _De_ / _From_ en la Configuración de la API, no a tu propio número). Pon algo como "Hola, ¿a qué hora abren?".
2. En la terminal del servidor debe salir: `WhatsApp webhook: 1 mensaje(s) y 0 estado(s) recibidos`.
3. Abre Colibri (`http://localhost:3000`) e inicia sesión con el correo y la contraseña que pusiste en `AUTH_ADMIN_EMAIL` y `AUTH_ADMIN_PASSWORD` y entra a **Mensajes**: la conversación aparece sola en unos segundos. También cuenta como "Mensajes pendientes" en **Inicio**.
4. **Responder.** Ábrela, escribe una respuesta y pulsa **Enviar** (o Enter). Debe llegar a tu WhatsApp.

🎉 Si llegó, la integración completa funciona.

---

## Qué hacer cada día que retomes el trabajo

| Situación                                | Qué hacer                                                                                                       |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Empiezas a trabajar                      | 1) `pnpm dev`. 2) Abre el túnel (paso 8). 3) Si la dirección cambió, actualízala en Meta (paso 9, solo la URL). |
| Pasaron más de 24 horas desde el token   | Genera uno nuevo (paso 6), cámbialo en `server/.env` y reinicia `pnpm dev`.                                     |
| Quieres responder y falla por la ventana | La persona debe escribirte de nuevo; fuera de las 24 horas solo se pueden enviar plantillas.                    |
| Escribirás desde otro teléfono           | Regístralo primero como destinatario (paso 4). El límite es de 5 números.                                       |

## Token permanente (opcional)

Para no renovar el token cada día:

1. Entra a [business.facebook.com/settings](https://business.facebook.com/settings) (_Configuración del negocio_).
2. **Usuarios** → **Usuarios del sistema** → **Agregar**, con rol de administrador.
3. **Asignar activos**: agrégale tu app con control total.
4. **Generar token**, elige tu app, caducidad **Nunca**, y marca los permisos `whatsapp_business_messaging` y `whatsapp_business_management`.
5. Pon el token en `WHATSAPP_ACCESS_TOKEN` y reinicia.

## Problemas comunes

| Problema                                                | Causa probable                                                                 | Solución                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Meta no verifica el webhook                             | Servidor o túnel apagados, URL mal escrita o token distinto                    | Revisa `…/api/health` por el túnel y que el token sea idéntico                 |
| `/api/channels` dice `not_configured`                   | Falta una variable de WhatsApp en `server/.env`                                | Revisa las cinco variables y reinicia el servidor                              |
| El botón **Probar** llega, pero tus mensajes no         | La app no está suscrita a la cuenta                                            | Paso 10                                                                        |
| El log dice "evento ignorado: es del número 123456123…" | Es el evento de ejemplo del botón **Probar**                                   | Es normal. **No** cambies `WHATSAPP_PHONE_NUMBER_ID` por ese número            |
| El log dice "firma inválida"                            | `WHATSAPP_APP_SECRET` incorrecto                                               | Copia de nuevo la clave secreta (paso 5)                                       |
| No aparece nada en la terminal al escribir              | URL del túnel cambió, no está suscrito a `messages` o escribiste a otro número | Pasos 8, 9 y 10; escribe al número de prueba                                   |
| Responder falla con "token expirado" (190)              | El token temporal venció                                                       | Paso 6                                                                         |
| Responder falla por la ventana de 24 horas              | La persona no escribió en el último día                                        | Que escriba de nuevo                                                           |
| Las conversaciones desaparecen al reiniciar             | El servidor las guarda en memoria                                              | Configura PostgreSQL ([Servidor → Almacenamiento](servidor.md#almacenamiento)) |

## Seguridad

- Los secretos (clave de la app y tokens) van **solo** en `server/.env`. No los pegues en chats, código, capturas ni commits.
- Si uno se filtra, regénéralo en Meta de inmediato.
- Usa únicamente cuentas y teléfonos propios o de tu equipo.
