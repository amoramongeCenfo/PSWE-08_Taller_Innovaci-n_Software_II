# Integración con Instagram Direct

Cómo conectar una cuenta de Instagram para que sus mensajes directos lleguen a Colibri y puedas responder desde la pantalla Mensajes. Usa la **API de Instagram con inicio de sesión de Instagram**, que no necesita una página de Facebook.

> Los nombres de los menús de Meta cambian con frecuencia. Si algún texto no coincide exactamente, busca el equivalente en el panel de tu app.

## Qué esperar (y qué no)

- La app sigue en **modo desarrollador**: solo recibes mensajes de cuentas que tengan un rol en la app (administrador, desarrollador o **probador de Instagram**). Cualquier otra persona no podrá escribirte todavía.
- La cuenta que recibe los mensajes debe ser **profesional** (negocio o creador). Se cambia en Instagram > Configuración > Tipo de cuenta.
- Como en WhatsApp, solo puedes responder dentro de las **24 horas** siguientes al último mensaje de la persona.
- Un mensaje de respuesta puede tener hasta **1000 bytes** (aprox. 1000 caracteres sin tildes ni emojis).
- Por ahora solo se guarda **texto**. Fotos, audios y stickers aparecen como "mensaje no soportado".

## Parte A. Configuración en Meta (una sola vez)

1. En [developers.facebook.com](https://developers.facebook.com), abre la misma app que usas para WhatsApp.
2. En **Use cases** (Casos de uso), pulsa **Add use cases** y agrega el de Instagram (**Manage messaging & content on Instagram**). Luego pulsa **Customize** en ese caso y entra a **API setup with Instagram login** (Configuración de la API con inicio de sesión de Instagram).
3. **Agregar la cuenta:** en el paso de generar tokens, agrega la cuenta profesional de Instagram. Si la cuenta es de otra persona, primero hay que invitarla como **probador de Instagram** (Roles de la app > Roles) y ella debe aceptar la invitación en Instagram (Configuración > Apps y sitios web > Invitaciones de probador).
4. **Generar el token:** pulsa generar token para esa cuenta y cópialo directo a `server/.env`. Ahí mismo verás el **identificador de la cuenta**.
5. **Clave secreta:** en esa misma página aparece el **secreto de la app de Instagram**. Es distinto del de la app principal.
6. En **Permisos de la app** (Revisión de la app), el permiso `instagram_business_manage_messages` debe estar disponible; en modo desarrollador funciona sin revisión.

## Variables de entorno

Agrega esto a `server/.env` (nunca lo compartas ni lo subas a Git):

| Variable                  | Qué es                                                                          |
| ------------------------- | ------------------------------------------------------------------------------- |
| `INSTAGRAM_VERIFY_TOKEN`  | Texto que tú inventas; debe ser igual al del webhook en Meta                    |
| `INSTAGRAM_APP_SECRET`    | Secreto de la app de Instagram (valida la firma de cada evento)                 |
| `INSTAGRAM_ACCESS_TOKEN`  | Token de la cuenta de Instagram (sirve para enviar)                             |
| `INSTAGRAM_ACCOUNT_ID`    | Identificador de la cuenta profesional                                          |
| `INSTAGRAM_DEBUG_WEBHOOK` | `true` imprime el cuerpo completo de cada evento (depuración; incluye el texto) |
| `INSTAGRAM_SIMULATE`      | `true` para el modo simulado (solo demostraciones)                              |

`GRAPH_API_VERSION` se comparte con WhatsApp. Reinicia `pnpm dev` después de editar el archivo.

## Parte B. Registrar el webhook

Necesitas el mismo túnel público que usas para WhatsApp (ver [Integración con WhatsApp](integracion-whatsapp.md), parte B).

1. En **Configuración de la API con inicio de sesión de Instagram**, paso **Configurar webhooks**.
2. **URL de devolución de llamada:** `https://TU-TUNEL/api/webhooks/instagram`
3. **Token de verificación:** el mismo valor de `INSTAGRAM_VERIFY_TOKEN`.
4. Pulsa **Verificar y guardar**. En la consola del servidor debe aparecer `Instagram webhook: verificación correcta`.
5. Suscribe el campo **`messages`** para la cuenta (el mismo panel tiene el interruptor de suscripción por cuenta).

## Suscribir la app a la cuenta

Igual que en WhatsApp, configurar el webhook no basta: Meta solo envía los mensajes reales a las apps **suscritas a la cuenta**. Con el token y el identificador ya en `server/.env`, ejecuta:

```bash
pnpm --filter @colibri/server instagram:subscribe
```

Primero muestra a qué cuenta pertenece el token y avisa si `INSTAGRAM_ACCOUNT_ID` no coincide (es el error más común). Luego muestra las apps suscritas antes y después; tu app debe aparecer con los eventos `messages` y `messaging_seen`. Si Meta responde con un error, copia el mensaje (no el token) y lo revisamos.

## Probar

1. Necesitas **dos cuentas con rol** en la app: la que recibe (la conectada) y la que escribe, ambas como probadoras de Instagram. Desde **otra** cuenta de Instagram con rol en la app, envía un mensaje directo a la cuenta conectada.
2. En la consola debe verse `Instagram webhook: 1 mensaje(s) y 0 estado(s) recibidos`.
3. Abre **Mensajes** en Colibri: aparece la conversación con el canal Instagram. Responde desde ahí.

## Modo simulado (para presentaciones)

Meta solo entrega mensajes reales de Instagram a una app **publicada** (modo Live). Si necesitas presentar sin salir del modo desarrollador, Colibri trae un modo simulado que recorre el mismo camino real: webhook firmado, validación, guardado, pantalla Mensajes y respuesta.

1. En `server/.env` pon `INSTAGRAM_VERIFY_TOKEN` y `INSTAGRAM_APP_SECRET` con cualquier texto (no hace falta Meta) y `INSTAGRAM_SIMULATE=true`. Reinicia `pnpm dev`: debe decir `Instagram: MODO SIMULADO`.
2. En otra terminal, simula que una persona escribe:

```bash
pnpm --filter @colibri/server instagram:simulate "Hola, ¿a qué hora abren?" --from "Ana Mora"
```

3. En **Mensajes** aparece la conversación de Instagram con el nombre "Ana Mora". Al responder, el mensaje queda guardado como enviado, pero **no se envía a Meta**.
4. Repite con otros textos y nombres para mostrar varias conversaciones.

Notas:

- El modo simulado se rechaza si `NODE_ENV=production`: es solo para demostraciones.
- Apágalo (`INSTAGRAM_SIMULATE=` vacío) cuando uses Instagram real.
- Los mensajes simulados son de contactos con identificador `sim:Nombre`, y el servidor solo los trata como simulados mientras `INSTAGRAM_SIMULATE=true`.

## Cómo funciona dentro de Colibri

- `POST /api/webhooks/instagram` valida la firma `X-Hub-Signature-256` con `INSTAGRAM_APP_SECRET` sobre el cuerpo sin modificar (igual que WhatsApp) y traduce el evento en `instagram.mapper.ts`.
- Se ignoran los **ecos** (mensajes que envía la propia cuenta) y los eventos de otras cuentas distintas a `INSTAGRAM_ACCOUNT_ID`.
- El evento solo trae el identificador de la persona (IGSID). Colibri consulta su nombre o `@usuario` a Meta una vez por envío; si falla, el mensaje se guarda igual y la interfaz muestra "N/A".
- El envío usa `POST https://graph.instagram.com/{versión}/{cuenta}/messages` con el token en el encabezado. El error de "fuera de la ventana" (código 10, subcódigo 2534022) se traduce a `REPLY_WINDOW_EXPIRED`.
- Los mensajes se guardan en las mismas tablas que los de WhatsApp (`channel = 'instagram'`); no hizo falta una migración.
- Lecturas: cuando la persona abre tu mensaje, Meta avisa y Colibri marca el mensaje como leído.

## Problemas comunes

| Síntoma                                            | Causa probable                                          | Qué hacer                                                 |
| -------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------- |
| Meta no verifica el webhook                        | El token no coincide o el túnel cambió de URL           | Revisa `INSTAGRAM_VERIFY_TOKEN` y la URL actual del túnel |
| `firma inválida` en la consola                     | `INSTAGRAM_APP_SECRET` es el de la app principal        | Usa el secreto que aparece en la página de Instagram      |
| No llega nada                                      | Falta suscribir `messages` o quien escribe no tiene rol | Suscribe el campo y agrega a la persona como probadora    |
| `evento ignorado: es de la cuenta …`               | `INSTAGRAM_ACCOUNT_ID` no es el de la cuenta que recibe | Copia el identificador correcto del panel                 |
| Responder falla con "No pudimos enviar el mensaje" | Token vencido o sin permisos                            | Genera un token nuevo (dura unos 60 días) y reinicia      |

## Si Meta no deja agregar la cuenta

Si al agregar la cuenta de Instagram aparece _"Unable to add a user with a role on the app's owning business"_, la app pertenece a un portafolio de negocio y la persona ya forma parte de él. Meta no permite agregarla como probadora. Solución: crear una **segunda app sin portafolio** solo para Instagram y usar sus datos en las variables `INSTAGRAM_*`. WhatsApp sigue con su app actual: las variables de cada canal son independientes y el webhook de Instagram es el mismo (`/api/webhooks/instagram`).

## Seguridad

- Tokens y secretos solo en `server/.env`. Si se filtran, regéneralos en Meta.
- Usa solo cuentas propias o de tu equipo durante las pruebas.
