# Integración con Facebook Messenger

Cómo conectar una página de Facebook para que sus mensajes de Messenger lleguen a Colibri y puedas responder desde la pantalla Mensajes. Funciona igual que WhatsApp: webhook firmado, envío por la API de Meta y ventana de 24 horas.

> Los nombres de los menús de Meta cambian con frecuencia. Si algún texto no coincide exactamente, busca el equivalente en el panel de tu app.

## Qué esperar (y qué no)

- La app sigue en **modo desarrollador**: solo funcionan las conversaciones con personas que tengan un rol en la app (administrador, desarrollador o probador). Tú, como administradora, puedes escribirle a la página desde tu perfil personal.
- Se usa una **página de Facebook**. Si no tienes una para pruebas, créala en [facebook.com/pages/create](https://www.facebook.com/pages/create).
- Solo puedes responder dentro de las **24 horas** siguientes al último mensaje de la persona.
- Una respuesta puede tener hasta **2000 caracteres**.
- Por ahora solo se guarda **texto**. Fotos, audios y stickers aparecen como "mensaje no soportado".

## Parte A. Configuración en Meta (una sola vez)

1. En [developers.facebook.com](https://developers.facebook.com), abre la app que usas para WhatsApp (**Colibri Dev**).
2. En **Use cases**, pulsa **Add use cases** y agrega el de Messenger (algo como **Engage with customers on Messenger from Meta**). Luego pulsa **Customize** en ese caso y entra a **Messenger API Settings**.
3. **Conectar la página:** en el paso de generar tokens, conecta tu página de Facebook y acepta los permisos que pida (`pages_messaging`, `pages_manage_metadata`, `pages_show_list`).
4. **Generar el token:** pulsa generar token para esa página y cópialo directo a `server/.env`.
5. **Clave secreta:** está en **App settings > Basic** (App secret). Si usas la misma app que WhatsApp, es el mismo valor de `WHATSAPP_APP_SECRET`.

## Variables de entorno

Agrega esto a `server/.env` (nunca lo compartas ni lo subas a Git):

| Variable                      | Qué es                                                               |
| ----------------------------- | -------------------------------------------------------------------- |
| `MESSENGER_VERIFY_TOKEN`      | Texto que tú inventas; debe ser igual al del webhook en Meta         |
| `MESSENGER_APP_SECRET`        | Secreto de la app (valida la firma de cada evento)                   |
| `MESSENGER_PAGE_ACCESS_TOKEN` | Token de la página (sirve para enviar y leer el nombre del contacto) |
| `MESSENGER_PAGE_ID`           | Identificador de la página (el comando de suscripción te lo dice)    |
| `MESSENGER_DEBUG_WEBHOOK`     | `true` imprime el cuerpo completo de cada evento (depuración)        |

`GRAPH_API_VERSION` se comparte con los demás canales. Reinicia `pnpm dev` después de editar el archivo.

## Parte B. Registrar el webhook

Usa el mismo túnel público de WhatsApp (ver [Integración con WhatsApp](integracion-whatsapp.md), parte B).

1. En **Messenger API Settings**, sección **Configure webhooks**.
2. **URL de devolución de llamada:** `https://TU-TUNEL/api/webhooks/messenger`
3. **Token de verificación:** el mismo valor de `MESSENGER_VERIFY_TOKEN`.
4. Pulsa **Verify and save**. En la consola del servidor debe aparecer `Messenger webhook: verificación correcta`.
5. Suscribe los campos **`messages`** y **`message_deliveries`** para tu página.

## Parte C. Suscribir la app a la página

Igual que en WhatsApp e Instagram, configurar el webhook no siempre basta: Meta solo envía los mensajes a las apps **suscritas a la página**. Con el token en `server/.env`, ejecuta:

```bash
pnpm --filter @colibri/server messenger:subscribe
```

Primero muestra a qué página pertenece el token y avisa si `MESSENGER_PAGE_ID` no coincide (cópialo de ahí). Luego suscribe la app y muestra las apps suscritas antes y después; la tuya debe aparecer con `messages` y `message_deliveries`.

## Probar

1. Desde tu perfil personal de Facebook (o el de alguien con rol en la app), entra a tu página y envíale un mensaje por **Messenger**.
2. En la consola debe verse `Messenger webhook: 1 mensaje(s) y 0 estado(s) recibidos`.
3. Abre **Mensajes** en Colibri: aparece la conversación con el canal Messenger y el nombre de la persona. Responde desde ahí.

## Cómo funciona dentro de Colibri

- `POST /api/webhooks/messenger` valida la firma `X-Hub-Signature-256` con `MESSENGER_APP_SECRET` sobre el cuerpo sin modificar y traduce el evento en `messenger.mapper.ts`. El router es el mismo que usa Instagram (`modules/channels/metaWebhookRouter.ts`).
- Se ignoran los **ecos** (mensajes que envía la propia página) y los eventos de páginas distintas a `MESSENGER_PAGE_ID`.
- El evento trae el identificador de la persona para tu página (PSID). Colibri consulta su nombre a Meta una vez por envío; si falla, el mensaje se guarda igual y la interfaz muestra "N/A".
- El envío usa `POST https://graph.facebook.com/{versión}/{página}/messages` con `messaging_type: RESPONSE`. El error de "fuera de la ventana" (código 10, subcódigo 2018278) se traduce a `REPLY_WINDOW_EXPIRED`.
- Las confirmaciones de entrega marcan tus respuestas como **entregadas**. Las lecturas de Messenger no indican qué mensaje se leyó (solo una fecha), así que por ahora no se usan.
- Los mensajes se guardan en las mismas tablas que los demás canales (`channel = 'messenger'`); no hizo falta una migración.

## Problemas comunes

| Síntoma                                                        | Causa probable                                       | Qué hacer                                                                  |
| -------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------- |
| Meta no verifica el webhook                                    | El token no coincide o el túnel cambió de URL        | Revisa `MESSENGER_VERIFY_TOKEN` y la URL actual del túnel                  |
| `firma inválida` en la consola                                 | `MESSENGER_APP_SECRET` no es el de esta app          | Copia el App secret de **App settings > Basic** de la misma app            |
| El botón **Test** llega, pero los mensajes reales no           | La app no está suscrita a la página                  | Ejecuta `messenger:subscribe`                                              |
| `evento ignorado: es de la página …`                           | `MESSENGER_PAGE_ID` no es el de la página que recibe | Copia el id que muestra `messenger:subscribe`                              |
| No llega nada al escribirle a la página                        | Quien escribe no tiene rol en la app                 | Escribe desde tu perfil (administradora) o agrega a la persona como tester |
| `messenger:subscribe` dice "El token es de un USUARIO"         | Se copió el token de usuario de Graph API Explorer   | En el menú **User or Page** elige tu página y copia ese token              |
| `Requires pages_manage_metadata permission`                    | Al token le faltan permisos                          | Agrega los permisos al caso de uso y **genera un token nuevo**             |
| Cambiaste `server/.env` y el servidor sigue con el valor viejo | `pnpm dev` no relee el `.env` al recargar código     | Detén `pnpm dev` (Ctrl+C) y vuelve a iniciarlo                             |
| Para ver qué envía Meta exactamente                            | —                                                    | Pon `MESSENGER_DEBUG_WEBHOOK=true`, reinicia y revisa la consola           |

## Seguridad

- Tokens y secretos solo en `server/.env`. Si se filtran, regéneralos en Meta.
- Apaga `MESSENGER_DEBUG_WEBHOOK` al terminar: imprime el texto de los mensajes.
