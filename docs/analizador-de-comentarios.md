# Guía: analizador de comentarios (alertas de reputación)

Esta guía es para el área de análisis. Explica cómo el motor de **alertas de reputación** (etapa 5)
analiza los comentarios públicos y cómo conectar un modelo de lenguaje (LLM) sin tocar el resto del
proyecto.

## Qué hace el analizador

Recibe un comentario y responde cuatro cosas (contrato en
`server/src/modules/alerts/commentAnalyzer.ts`):

| Campo        | Tipo                                                 | Significado                                               |
| ------------ | ---------------------------------------------------- | --------------------------------------------------------- |
| `risk`       | `alto` · `medio` · `bajo`                            | Nivel de riesgo reputacional                              |
| `confidence` | número de 0 a 1                                      | Qué tan seguro está. `0` significa que no detectó riesgo  |
| `triggers`   | lista de textos                                      | Palabras o frases del comentario que dispararon la alerta |
| `category`   | `estafa` · `salud` · `calidad` · `atencion` · `otro` | Categoría del riesgo principal                            |

```ts
export interface CommentAnalyzer {
  analyze(input: {
    text: string;
    channel: 'whatsapp' | 'instagram' | 'messenger';
    keywords: string[]; // palabras del negocio que generan alerta inmediata
    sensitivity: 'grave' | 'normal' | 'todo';
  }): Promise<CommentAnalysis>;
}
```

El analizador **no envía nada ni lee la base de datos**: solo analiza. El motor decide con su
respuesta. Sigue el mismo patrón de contrato que el analizador de mensajes de "Contesta solo"
(ver [Analizador de mensajes](analizador-de-mensajes.md)).

## Las dos implementaciones

- **`BasicCommentAnalyzer`** — detecta riesgo por palabras clave del español de Costa Rica. No
  depende de ningún servicio. Es el que se usa cuando no hay un LLM configurado.
- **`LlmCommentAnalyzer`** — usa un modelo de lenguaje: entiende el sentido del mensaje (jerga,
  errores, emojis) mucho mejor. Envuelve dos protecciones:
  1. **Respaldo:** si el LLM falla, no responde o devuelve algo inválido, usa el `BasicCommentAnalyzer`.
     Una alerta nunca se pierde por un error del servicio.
  2. **Barandas:** la sensibilidad del negocio y las palabras clave se aplican en el código, no se
     delegan al LLM. Así el resultado siempre cumple el contrato, diga lo que diga el modelo.

Qué cumplen ambas (pruebas de contrato en `commentAnalyzer.contract.ts`):

- Sin riesgo detectado, `confidence` es `0` y `triggers` está vacío.
- Sensibilidad `grave`: solo pasan los riesgos altos.
- Sensibilidad `todo`: también detecta señales leves.
- Las palabras clave del negocio disparan alerta sin importar mayúsculas ni tildes.

## Conectar un LLM (y cambiar de proveedor)

El proveedor se elige por configuración; no se toca el código del analizador ni del motor. Variables
en `server/.env` (ver `server/.env.example`):

```bash
LLM_PROVIDER=anthropic     # "anthropic", "openai", "ollama" (local) o vacío (solo palabras clave)
LLM_API_KEY=sk-...         # clave del servicio (con "ollama" no hace falta)
LLM_MODEL=                 # opcional; vacío usa el por defecto (anthropic: claude-opus-5-5)
LLM_BASE_URL=              # opcional; para Ollama, un gateway o pruebas
LLM_TIMEOUT_MS=            # opcional; vacío usa el por defecto (nube 8000, Ollama 60000)
```

Con `LLM_PROVIDER` definido (y `LLM_API_KEY` donde haga falta), el motor usa el `LlmCommentAnalyzer`;
si está vacío, usa el `BasicCommentAnalyzer`. El comportamiento por defecto (sin configurar) no cambia.

### Probar con Ollama (modelos locales)

[Ollama](https://ollama.com) corre modelos en tu máquina y expone una API compatible con OpenAI, así
que funciona con el mismo adaptador. Pasos:

1. Descarga un modelo, por ejemplo: `ollama pull llama3.1`
2. Asegúrate de que Ollama esté corriendo (`ollama serve`, o la app de escritorio).
3. En `server/.env`:

   ```bash
   LLM_PROVIDER=ollama
   LLM_MODEL=llama3.1        # el modelo que descargaste (ollama list los muestra)
   # LLM_API_KEY no hace falta
   # LLM_BASE_URL por defecto es http://localhost:11434
   ```

4. Reinicia el servidor. En la consola verás `Alertas: analizador con IA (openai)` (Ollama usa el
   adaptador de OpenAI). Prueba con `POST /api/alerts/analyze`.

Si tu modelo es grande o tu equipo es lento, sube `LLM_TIMEOUT_MS` (por defecto 60000 para Ollama);
si se agota el tiempo, el análisis cae al respaldo por palabras clave sin perder la alerta.

### Agregar otro fabricante

Cada proveedor es un adaptador delgado que implementa `LlmProvider`
(`server/src/modules/alerts/llmProvider.ts`): recibe una instrucción y un texto, devuelve texto.
Para sumar uno nuevo:

1. Crea `miProveedor.ts` con una clase que implemente `LlmProvider` (mira `anthropicProvider.ts` y
   `openAiProvider.ts` como ejemplo; usan `fetch`, sin dependencias nuevas).
2. Agrega un `case` en `createLlmProvider` dentro de `llmProviderFactory.ts`.
3. Nada más del proyecto cambia: el analizador y las rutas no distinguen qué proveedor se usa.

## Probar sin gastar llamadas

- `POST /api/alerts/analyze` con `{ "text": "...", "channel": "whatsapp" }` devuelve el análisis del
  texto usando la configuración actual. Útil para ver el resultado a mano.
- Las pruebas (`llmCommentAnalyzer.test.ts`, `llmProviders.test.ts`) inyectan un proveedor falso o
  un `fetch` simulado, así que corren sin red: `pnpm --filter @colibri/server test`.
