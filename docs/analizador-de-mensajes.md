# Guía: analizador de mensajes

Esta guía es para el área de análisis. Explica cómo conectar su analizador al motor **"Contesta solo"** sin tocar el resto del proyecto.

## Qué hace el analizador

Recibe cada texto nuevo de un cliente y responde tres cosas:

| Campo        | Tipo               | Significado                                                                                                    |
| ------------ | ------------------ | -------------------------------------------------------------------------------------------------------------- |
| `topic`      | `TopicId` o `null` | `hours`, `location`, `pricing`, `availability`, `shipping`, `orders`, `complaints`, o `null` si no corresponde |
| `confidence` | número de 0 a 1    | Qué tan seguro está                                                                                            |
| `blocked`    | `true` o `false`   | `true` si el mensaje toca uno de los temas prohibidos que escribió el negocio                                  |

El contrato está en `server/src/modules/autoreply/messageAnalyzer.ts`:

```ts
export interface MessageAnalyzer {
  analyze(input: {
    text: string;
    channel: 'whatsapp' | 'instagram' | 'messenger';
    blockedTopics: string[];
  }): Promise<MessageAnalysis>;
}
```

El analizador **no envía nada ni lee la base de datos**: solo analiza. El motor decide con su respuesta.

## Qué hace el motor con la respuesta

Colibri contesta solo únicamente si se cumplen **todas** estas condiciones (en este orden):

1. Las respuestas automáticas no están en pausa (Mi negocio › Qué contesta Colibri).
2. `blocked` es `false`.
3. `topic` no es `null` ni `complaints` (los reclamos nunca se contestan solos).
4. `confidence` es mayor o igual a `AUTOREPLY_MIN_CONFIDENCE` (por defecto `0.7`).
5. El negocio puso esa consulta en **Contesta solo**.
6. La información del negocio para ese tema está completa.
7. Nadie contestó todavía en este turno del cliente.

Cada decisión queda en la consola del servidor, **sin el texto del cliente**, por ejemplo:

```text
Contesta solo: horario, confianza 0.92, enviado
Contesta solo: envíos, confianza 0.80, no enviado: falta información
```

Sirve para medir qué tan bien funciona el analizador con mensajes reales.

## Pasos para conectar su analizador

1. Cree su clase en `server/src/modules/autoreply/` (por ejemplo `miAnalizador.ts`) que implemente `MessageAnalyzer`.
2. Cree `miAnalizador.test.ts` y corra las pruebas de contrato, que todo analizador debe pasar:

   ```ts
   import { describeMessageAnalyzer } from './messageAnalyzer.contract';
   import { MiAnalizador } from './miAnalizador';

   describeMessageAnalyzer('mi analizador', () => new MiAnalizador());
   ```

3. Cambie **una línea** en `server/src/index.ts`:

   ```ts
   const analyzer: MessageAnalyzer = new MiAnalizador();
   ```

4. Corra `pnpm --filter @colibri/server test`.

Si su analizador llama a un servicio externo (por ejemplo un modelo de lenguaje), guarde la clave en `server/.env` y léala desde `server/src/config.ts`, igual que las demás variables. Si el servicio falla, devuelva `{ topic: null, confidence: 0, blocked: false }`: el mensaje queda pendiente para la persona, que es lo seguro.

## El analizador básico de ejemplo

`basicMessageAnalyzer.ts` busca palabras clave del español de Costa Rica (sin tildes ni mayúsculas). Solo existe para probar de punta a punta:

- Un tema reconocido: confianza 0.8 (0.9 con dos o más palabras clave).
- Varios temas en el mismo mensaje: confianza 0.5 (no alcanza para contestar solo).
- Si aparece un reclamo, gana siempre.
- `blocked`: el tema prohibido aparece tal cual en el mensaje.

## Para probar sin Meta

Con `INSTAGRAM_SIMULATE=true` (ver [Integración con Instagram](integracion-instagram.md)) se pueden enviar mensajes simulados al webhook y ver en la consola la decisión del motor y, en Mensajes, la respuesta marcada como **"Respondido solito"**.
