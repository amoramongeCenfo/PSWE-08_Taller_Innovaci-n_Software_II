# Configuración: análisis de alertas con IA

Guía para configurar y correr el análisis de **alertas de reputación** (etapa 5) con un modelo de
lenguaje (LLM). El diseño del analizador está en [Analizador de comentarios](analizador-de-comentarios.md);
esta guía es la referencia de **configuración y operación**.

## Resumen

El motor de alertas analiza cada comentario con un `CommentAnalyzer`. Hay dos:

- **Por palabras clave** (`BasicCommentAnalyzer`): sin dependencias. Es el valor por defecto.
- **Con IA** (`LlmCommentAnalyzer`): usa un LLM y entiende el sentido del mensaje. Se activa con
  configuración. Si el LLM falla, cae automáticamente al de palabras clave (no se pierde una alerta).

Todo se configura con variables de entorno en `server/.env` (plantilla en `server/.env.example`).

## Variables de entorno

| Variable         | Obligatoria        | Por defecto                 | Descripción                                                   |
| ---------------- | ------------------ | --------------------------- | ------------------------------------------------------------- |
| `LLM_PROVIDER`   | para usar IA       | _(vacío = sin IA)_          | `anthropic`, `openai`, `ollama` o vacío (solo palabras clave) |
| `LLM_API_KEY`    | nube sí, Ollama no | _(vacío)_                   | Clave del servicio. Con `ollama` no hace falta                |
| `LLM_MODEL`      | con Ollama sí      | según proveedor (ver abajo) | Modelo a usar                                                 |
| `LLM_BASE_URL`   | no                 | la oficial del proveedor    | URL base. Con `ollama`, por defecto `http://localhost:11434`  |
| `LLM_TIMEOUT_MS` | no                 | nube `8000`, Ollama `60000` | Tiempo máximo de espera, en milisegundos                      |

Modelo por defecto según proveedor cuando `LLM_MODEL` está vacío:

- `anthropic` → `claude-opus-5-5`
- `openai` → `gpt-4o-mini`
- `ollama` → **sin valor por defecto**: es obligatorio poner uno que tengas descargado.

### Regla de activación

- Si `LLM_PROVIDER` está vacío → se usa el analizador por palabras clave.
- Si `LLM_PROVIDER` está puesto (y `LLM_API_KEY` donde hace falta) → se usa el analizador con IA.
- El comportamiento por defecto (sin configurar nada) **no cambia**.

## Ejemplos por proveedor

### Ollama (modelos locales, recomendado para pruebas)

```bash
LLM_PROVIDER=ollama
LLM_MODEL=gemma4:latest   # un modelo descargado; mira `ollama list`
# LLM_API_KEY no hace falta
# LLM_BASE_URL por defecto http://localhost:11434
# LLM_TIMEOUT_MS por defecto 60000 (súbelo si tu equipo es lento)
```

Requisitos: tener [Ollama](https://ollama.com) corriendo y el modelo descargado
(`ollama pull gemma4:latest`). Ollama expone una API compatible con OpenAI, por eso funciona con el
mismo adaptador.

### Anthropic (Claude)

```bash
LLM_PROVIDER=anthropic
LLM_API_KEY=sk-ant-...
LLM_MODEL=claude-opus-5-5   # opcional; este es el valor por defecto
```

### OpenAI

```bash
LLM_PROVIDER=openai
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini       # opcional; este es el valor por defecto
```

## Cómo correr la aplicación

Desde la raíz del proyecto:

```bash
pnpm install   # una sola vez (o si cambian dependencias)
pnpm dev       # servidor (http://localhost:3001) + cliente (http://localhost:3000)
```

Luego abre http://localhost:3000 e inicia sesión con la cuenta definida en `server/.env`
(`AUTH_ADMIN_EMAIL` / `AUTH_ADMIN_PASSWORD`).

> **Nota (Windows): si el servidor crashea con `esbuild.exe ENOENT`.** Es un problema del binario de
> `esbuild` que usa `tsx` (a veces por el antivirus o un `pnpm install` incompleto). Soluciones:
>
> 1. Restaurar el binario: `pnpm install` (con internet) o `pnpm rebuild esbuild`.
> 2. Alternativa sin `tsx`: correr el servidor compilado:
>    ```bash
>    pnpm --filter @colibri/server build
>    cd server && node dist/index.js
>    ```
>    El cliente (`pnpm --filter @colibri/client dev`) le hace proxy al puerto 3001.

## Verificar que la IA está activa

1. Al arrancar el servidor, la consola imprime una de estas líneas:
   - `Alertas: analizador con IA (openai), respaldo por palabras clave.` → IA activa (Ollama usa el
     adaptador de OpenAI, por eso dice "openai").
   - `Alertas: analizador por palabras clave (sin LLM configurado).` → IA apagada.

2. Prueba el endpoint de análisis (requiere sesión iniciada):

   ```powershell
   $s = New-Object Microsoft.PowerShell.Commands.WebRequestSession
   Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method Post -ContentType "application/json" -WebSession $s -Body '{"email":"ana@colibri.cr","password":"clave-segura-1","keepSignedIn":false}' | Out-Null
   Invoke-RestMethod -Uri "http://localhost:3001/api/alerts/analyze" -Method Post -ContentType "application/json" -WebSession $s -Body '{"text":"Pedí un pastel y llegó podrido, casi me enfermo. Son unos estafadores.","channel":"instagram"}' | ConvertTo-Json
   ```

   Respuesta esperada (ejemplo real con `gemma4:latest`):

   ```json
   {
     "risk": "alto",
     "confidence": 0.95,
     "triggers": ["llegó podrido", "casi me enfermo", "estafadores"],
     "category": "estafa"
   }
   ```

> La **pantalla de Alertas** muestra las alertas de ejemplo precargadas (almacenamiento en memoria),
> no análisis en vivo. La IA trabaja en el endpoint `POST /api/alerts/analyze`. Para que la pantalla
> se llene con detecciones reales falta conectar la fuente de comentarios de las redes (pendiente en
> la [hoja de ruta](hoja-de-ruta.md)).

## Cambiar de proveedor o agregar uno nuevo

Cambiar de proveedor es solo cambiar `LLM_PROVIDER` (y la clave/modelo) y reiniciar. Para agregar un
fabricante nuevo:

1. Crea `server/src/modules/alerts/miProveedor.ts` con una clase que implemente `LlmProvider` (mira
   `anthropicProvider.ts` y `openAiProvider.ts`; usan `fetch`, sin dependencias nuevas).
2. Agrega un `case` en `createLlmProvider` dentro de `llmProviderFactory.ts`.
3. Nada más del proyecto cambia: el analizador y las rutas no dependen del proveedor.

## Solución de problemas

| Síntoma                                         | Causa probable                                   | Qué hacer                                                                         |
| ----------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------- |
| La consola dice "sin LLM configurado"           | `LLM_PROVIDER` vacío o falta la clave            | Revisa `server/.env` y reinicia                                                   |
| En consola: "el LLM falló; se usa el respaldo…" | El LLM no respondió o devolvió algo inválido     | Es la red de seguridad. Si pasa seguido, sube `LLM_TIMEOUT_MS` o cambia de modelo |
| Con Ollama, casi siempre cae al respaldo        | Modelo "con razonamiento" lento o tope de tiempo | Sube `LLM_TIMEOUT_MS`; prueba un modelo más pequeño o sin _thinking_              |
| El primer análisis tarda 15–25 s                | Ollama carga el modelo en memoria                | Normal; los siguientes son más rápidos                                            |
| `esbuild.exe ENOENT` al arrancar el servidor    | Binario de esbuild dañado/bloqueado              | `pnpm install` o `pnpm rebuild esbuild`; o correr el servidor compilado           |
| Login muestra "Algo salió mal de nuestro lado"  | El servidor (3001) no está corriendo             | Arranca el servidor; el cliente le hace proxy                                     |

## Seguridad

- La clave (`LLM_API_KEY`) va en `server/.env`, que **no** se sube a Git (`.gitignore`).
- Con Ollama todo corre en tu máquina: el texto de los comentarios no sale de tu equipo.
- Con un proveedor en la nube, el texto del comentario se envía a ese servicio para analizarlo.
