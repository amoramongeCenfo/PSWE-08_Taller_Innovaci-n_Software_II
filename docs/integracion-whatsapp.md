# Integración con WhatsApp

Guía para conectar Colibri a **WhatsApp Business Platform (Cloud API)** en **modo desarrollador**, con el número de prueba gratuito de Meta. Es suficiente para el proyecto del curso: no requiere revisión de la app ni verificación del negocio.

> **¿Primera vez?** Sigue el [Tutorial: Meta y WhatsApp](tutorial-meta-whatsapp.md), que va de la creación de la cuenta hasta el primer mensaje recibido. Esta guía es la referencia técnica.

> **Importante:** Meta cambia nombres de menús y versiones de la API con frecuencia. Si algo no coincide con esta guía, sigue la [documentación oficial de WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api) y actualiza este archivo.

## Qué esperar (y qué no)

| Con el número de prueba **sí** puedes                                       | **No** puedes                                                                          |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Recibir mensajes de hasta 5 teléfonos que tú registres                      | Recibir mensajes de cualquier persona                                                  |
| Responder dentro de las 24 horas siguientes al último mensaje de la persona | Escribir primero con texto libre (solo con una plantilla aprobada, como `hello_world`) |
| Recibir webhooks en tu servidor local con un túnel                          | Usar un número propio de negocio sin pasos extra de Meta                               |

La ventana de 24 horas es una regla de WhatsApp: fuera de ella solo se pueden enviar plantillas.

## Parte A. Configuración en Meta (una sola vez)

Hazlo con una cuenta de Facebook personal.

1. **Cuenta de desarrollador:** entra a [developers.facebook.com](https://developers.facebook.com) e inicia sesión. Acepta los términos y verifica tu cuenta si te lo pide.
2. **Crear la app:** _Mis apps_ → _Crear app_. Elige el caso de uso para conectar con clientes por **WhatsApp** (tipo _Business_). Ponle un nombre, por ejemplo `Colibri Dev`.
3. **Agregar WhatsApp:** en el panel de la app, agrega el producto **WhatsApp** y abre _Configuración de la API_ (o _API Setup_). Meta crea un número de prueba y un portafolio de negocio de prueba.
4. **Anota estos datos** (los usaremos como variables de entorno):
   - **Identificador del número de teléfono** (_Phone number ID_) → `WHATSAPP_PHONE_NUMBER_ID`
   - **Identificador de la cuenta de WhatsApp Business** (_WABA ID_), por si hace falta después
5. **Registrar destinatarios:** en el campo _Para_ (_To_), agrega tu número real y verifícalo con el código que llega por WhatsApp. Puedes agregar hasta 5.
6. **Mensaje de prueba:** pulsa _Enviar mensaje_ con la plantilla `hello_world`. Debe llegarte a WhatsApp. Responde algo desde el teléfono para abrir la ventana de 24 horas.
7. **Secreto de la app:** _Configuración de la app_ → _Básica_ → **Clave secreta de la app** (_App secret_) → `WHATSAPP_APP_SECRET`. Es privada.
8. **Token de acceso:**
   - El token del panel es **temporal (24 horas)**: sirve para las primeras pruebas.
   - Para uno **permanente**: en _Configuración del negocio_ (Business Settings) → _Usuarios_ → _Usuarios del sistema_, crea un usuario del sistema con rol de administrador, asígnale la app y genera un token con los permisos `whatsapp_business_messaging` y `whatsapp_business_management`. → `WHATSAPP_ACCESS_TOKEN`.

## Variables de entorno

Con los datos de la Parte A, copia `server/.env.example` como `server/.env` y complétalo:

```text
WHATSAPP_VERIFY_TOKEN=colibri-verify-2026   (lo inventas tú)
WHATSAPP_APP_SECRET=...                     (Configuración de la app > Básica)
WHATSAPP_ACCESS_TOKEN=...                   (token de acceso)
WHATSAPP_PHONE_NUMBER_ID=...                (identificador del número)
```

Reinicia el servidor (`pnpm dev`) para que las lea. Ábrelo en `http://localhost:3001/api/channels`: debe mostrar `"state": "active"` para WhatsApp.

## Parte B. Túnel público para el webhook

Meta necesita una URL pública `https` para enviar los mensajes a tu servidor local (puerto 3001).

1. Instala una herramienta de túnel gratuita: [ngrok](https://ngrok.com) o [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/).
2. Con el servidor corriendo, abre el túnel hacia `http://localhost:3001`. Ejemplo con ngrok: `ngrok http 3001`.
3. Copia la URL pública (algo como `https://abc123.ngrok-free.app`).

> En las versiones gratuitas esa URL puede cambiar cada vez que reinicias el túnel; tendrás que actualizarla en Meta.

## Parte C. Registrar el webhook en Meta

1. En el panel de la app: _WhatsApp_ → _Configuración_ → _Webhook_ → _Editar_.
2. **URL de devolución de llamada:** `https://TU-URL-PUBLICA/api/webhooks/whatsapp`
3. **Token de verificación:** inventa un texto (por ejemplo `colibri-verify-2026`) y ponlo igual en `WHATSAPP_VERIFY_TOKEN`.
4. Pulsa _Verificar y guardar_. Meta hace una petición `GET` al servidor; si responde bien, queda guardado.
5. En _Campos del webhook_, suscríbete a **`messages`**.

## Suscribir la app a la cuenta (si no llegan mensajes reales)

Configurar el webhook en el panel no siempre suscribe tu app a la cuenta de WhatsApp Business (WABA). Síntoma: el botón **Test** de Meta llega al servidor (con un número de ejemplo como `123456123`), pero los mensajes reales desde tu teléfono no.

1. Agrega a `server/.env` el **WhatsApp Business account ID** (el que anotaste en el paso 3): `WHATSAPP_BUSINESS_ACCOUNT_ID=...`
2. Ejecuta `pnpm --filter @colibri/server whatsapp:subscribe`. Muestra las apps suscritas antes y después; tu app debe aparecer en la lista final.
3. Escribe otro mensaje desde tu teléfono y mira la terminal del servidor.

Los eventos del botón **Test** traen datos de ejemplo (otro número de teléfono), por eso el servidor los ignora y lo avisa en su log. **No cambies** `WHATSAPP_PHONE_NUMBER_ID` por ese valor.

## Probar el webhook sin Meta (opcional)

Con el servidor corriendo y `WHATSAPP_VERIFY_TOKEN=prueba` y `WHATSAPP_APP_SECRET=secreto` en `server/.env`, puedes comprobar la verificación desde la terminal (Git Bash o macOS/Linux):

```bash
curl "http://localhost:3001/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=prueba&hub.challenge=123"
# Debe responder: 123
```

Un POST sin firma debe ser rechazado con 401, y uno con firma válida con 200; las pruebas automáticas (`pnpm test`) ya cubren ambos casos.

## Parte D. Cómo funciona dentro de Colibri

```text
Teléfono ──▶ WhatsApp ──▶ Meta ──POST /api/webhooks/whatsapp──▶ Servidor Colibri
                                                                   │ 1. verifica firma
                                                                   │ 2. traduce el mensaje
                                                                   │ 3. guarda (sin duplicados)
Cliente web ◀──GET /api/conversations── Servidor ◀─────────────────┘
Cliente web ──POST /api/conversations/:id/messages──▶ Servidor ──▶ API de Meta ──▶ Teléfono
```

### Verificación del webhook (`GET`)

Meta envía `hub.mode=subscribe`, `hub.verify_token` y `hub.challenge`. Si el token coincide con `WHATSAPP_VERIFY_TOKEN`, el servidor responde **200** con el valor de `hub.challenge` como texto; si no, **403**.

### Mensaje entrante (`POST`)

Forma simplificada del cuerpo (los campos exactos están en la documentación de Meta):

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "changes": [
        {
          "field": "messages",
          "value": {
            "metadata": { "phone_number_id": "123456789" },
            "contacts": [{ "profile": { "name": "Ana" }, "wa_id": "50688887777" }],
            "messages": [
              {
                "from": "50688887777",
                "id": "wamid.XXXX",
                "timestamp": "1760000000",
                "type": "text",
                "text": { "body": "Hola, ¿a qué hora abren?" }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

- La misma estructura trae **estados de entrega** (`statuses`: enviado, entregado, leído); se guardan para mostrar el estado del mensaje.
- Para empezar solo se procesan mensajes de tipo `text`. Los demás (imagen, audio, etc.) se guardan como "mensaje no soportado" y se agregan después.
- El servidor responde **200** de inmediato; Meta reintenta si no.

### Enviar una respuesta

`POST https://graph.facebook.com/{GRAPH_API_VERSION}/{WHATSAPP_PHONE_NUMBER_ID}/messages` con el encabezado `Authorization: Bearer {WHATSAPP_ACCESS_TOKEN}` y el cuerpo:

```json
{
  "messaging_product": "whatsapp",
  "to": "50688887777",
  "type": "text",
  "text": { "body": "Abrimos de 8 a. m. a 6 p. m." }
}
```

Si la ventana de 24 horas expiró, Meta rechaza el mensaje; el servidor debe devolver un error claro y la interfaz mostrar "Pasaron más de 24 horas desde el último mensaje de esta persona".

## Problemas comunes

| Problema                                               | Causa probable                                                                 | Solución                                                                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Meta no puede verificar el webhook                     | El servidor no está corriendo, el túnel está cerrado o el token no coincide    | Revisa `pnpm dev`, la URL del túnel y `WHATSAPP_VERIFY_TOKEN`                                                         |
| El mensaje de prueba no llega                          | El número no está registrado como destinatario                                 | Agrégalo y verifícalo en el paso 5                                                                                    |
| Error 190 / "token expirado"                           | El token temporal duró solo 24 horas                                           | Genera uno nuevo o crea el token permanente (paso 8)                                                                  |
| No llegan webhooks                                     | No estás suscrito al campo `messages` o la URL del túnel cambió                | Revisa la Parte C                                                                                                     |
| Responder falla con error de ventana                   | Pasaron más de 24 horas                                                        | Pide a la persona que escriba de nuevo, o usa una plantilla                                                           |
| Funciona el botón **Test** pero no los mensajes reales | La app de Meta no está **suscrita** a la cuenta de WhatsApp Business           | Completa `WHATSAPP_BUSINESS_ACCOUNT_ID` en `server/.env` y ejecuta `pnpm --filter @colibri/server whatsapp:subscribe` |
| Firma inválida (401)                                   | `WHATSAPP_APP_SECRET` incorrecto o el cuerpo fue modificado antes de verificar | Copia de nuevo el secreto y verifica sobre el cuerpo crudo                                                            |

## Seguridad

- No pegues tokens ni secretos en el chat, en el código ni en capturas de pantalla. Van solo en `server/.env`.
- Si un secreto se filtra, regenéralo en Meta de inmediato.
- Usa solo cuentas y teléfonos propios o de tu equipo durante las pruebas.

## Siguientes canales

Instagram Direct y Facebook Messenger tienen su propia guía: [Integración con Instagram](integracion-instagram.md) e [Integración con Messenger](integracion-messenger.md).
