# Plan: respuestas automáticas ("Contesta solo")

> **Estado:** implementado (fases 1 a 6). El analizador definitivo queda en manos del área de análisis: ver la [guía del analizador](analizador-de-mensajes.md).

Objetivo: cuando una consulta está en **Contesta solo** (Mi negocio › Qué contesta Colibri), Colibri responde de inmediato con la **información del negocio**, con el tono y el trato elegidos.

El trabajo se divide en dos partes que se conectan por un contrato:

| Parte                    | Responsable                    | Qué hace                                                                               |
| ------------------------ | ------------------------------ | -------------------------------------------------------------------------------------- |
| **Análisis del mensaje** | Compañero del área de análisis | Reconoce el tema del mensaje, calcula la confianza y detecta temas prohibidos          |
| **Respuesta automática** | Este plan                      | Guarda la información del negocio, redacta la respuesta, decide si se envía y la envía |

Fuera de alcance por ahora: "Me pregunta" (sugerencias para aprobar), alertas de reputación y el cálculo de confianza.

## Cómo funciona

```
Mensaje del cliente ─► se guarda (como hoy)
                    └► Analizador (contrato)  ─► { tema, confianza, prohibido }
                                                       │
                       Motor "Contesta solo" ◄─────────┘
                         ¿pausado? ¿prohibido? ¿confianza baja? ¿regla ≠ Contesta solo?
                         ¿falta la información? ¿ya respondió en este turno? ¿ventana de 24 h cerrada?
                           └─ si alguna es "sí": no hace nada (la conversación queda pendiente, como hoy)
                           └─ si no: Redactor ─► envía por el canal ─► guarda como "Respondido solito"
```

## Contrato del analizador (lo implementa el área de análisis)

Archivo: `server/src/modules/autoreply/messageAnalyzer.ts`

```ts
export interface MessageAnalysis {
  /** Tema reconocido, o null si no corresponde a ninguno. */
  topic: TopicId | null; // 'hours' | 'location' | 'pricing' | 'availability' | 'shipping' | 'orders' | 'complaints'
  /** Qué tan seguro está, de 0 a 1. */
  confidence: number;
  /** true si el mensaje toca uno de los temas que Colibri nunca debe contestar. */
  blocked: boolean;
}

export interface MessageAnalyzer {
  analyze(input: {
    text: string;
    channel: ChannelId;
    /** Temas prohibidos que escribió el negocio (Mi negocio › Temas que Colibri nunca debe contestar). */
    blockedTopics: string[];
  }): Promise<MessageAnalysis>;
}
```

- Mientras el área de análisis trabaja, el proyecto trae un **analizador básico** (`basicMessageAnalyzer.ts`) con unas pocas palabras clave, solo para poder probar de punta a punta. Se reemplaza cambiando una línea en `server/src/index.ts`.
- Pruebas de contrato compartidas (`messageAnalyzer.contract.ts`): cualquier analizador debe pasarlas (devuelve una confianza entre 0 y 1, `topic` válido o `null`, no falla con texto vacío o con emojis).
- Umbral de confianza: `AUTOREPLY_MIN_CONFIDENCE` en `server/.env` (por defecto 0.7).

## Fases

### Fase 1. Información del negocio

- **Mi negocio › "Lo que Colibri sabe de tu negocio"**, un bloque por tema:
  - Horario (estructurado): apertura y cierre por día, días cerrados y nota de feriados.
  - Ubicación: dirección, señas y enlace de Waze o Google Maps.
  - Precios y pagos: métodos de pago, número de SINPE Móvil (estructurado) y texto libre de precios.
  - Envíos, disponibilidad y encargos: texto libre.
- Aviso en "Qué contesta Colibri" cuando una consulta está en **Contesta solo** pero no tiene información: "Colibri no podrá contestar solo hasta que completes esta información".
- Servidor: tabla `business_knowledge` (migración 006), `GET/PUT /api/knowledge`, repositorio en memoria y PostgreSQL con pruebas de contrato.

- **Plantillas editables**: cada tema trae una plantilla de fábrica (según tono y trato) que se puede personalizar con variables como `{horario_hoy}`, `{direccion}`, `{sinpe}`, con vista previa y "Restaurar plantilla original". Si una plantilla usa un dato vacío, ese tema no se contesta solo; una variable que no existe se rechaza al guardar.

### Fase 2. Contrato del analizador

- `MessageAnalyzer` y `MessageAnalysis` (arriba), pruebas de contrato y el analizador básico.
- Documento corto para el compañero: cómo implementar, probar y conectar su analizador.

### Fase 3. Redactor de respuestas

- Plantillas por tema que combinan la información de la fase 1 con el estilo, el trato (usted, tú o vos) y la firma.
- Horario: responde según el día y la hora de Costa Rica ("Hoy abrimos de 8 a. m. a 6 p. m.", "Hoy domingo estamos cerrados; mañana abrimos a las 8 a. m.").
- "Reclamos y comentarios delicados" nunca se contesta solo, aunque la regla lo permita (se avisa en la pantalla).
- Pruebas: una por tema, por trato y por tono.

### Fase 4. Motor "Contesta solo"

- Se ejecuta después de guardar cada mensaje entrante (WhatsApp, Instagram, Messenger).
- Solo responde si se cumplen todas las condiciones del diagrama; si no, no hace nada.
- Una sola respuesta automática por turno del cliente.
- Cada mensaje guarda **quién** lo escribió: cliente, persona del negocio o Colibri (migración 006: columna `author`).
- Interruptor general **"Pausar respuestas automáticas"** en Mi negocio.
- Registro en la consola de cada decisión (sin el texto del cliente): "Contesta solo: horario, confianza 0.92, enviado" o "no enviado: falta información".

### Fase 5. Pantallas

- Mensajes: las respuestas de Colibri llevan la etiqueta **"Respondido solito"**.
- Inicio: el indicador **"Respondidos solitos"** deja de ser N/A (últimos 7 días).
- Mi negocio: el interruptor de pausa y los avisos de información faltante.

### Fase 6. Prueba completa y documentación

- De punta a punta con Instagram simulado y Messenger real: un mensaje por tema y cada condición del motor.
- README, arquitectura, servidor y hoja de ruta actualizados.

## Qué queda listo para el área de análisis

- Contrato `MessageAnalyzer`, pruebas de contrato y un analizador básico de ejemplo.
- Un único punto para conectar su implementación (`server/src/index.ts`).
- El umbral de confianza configurable y el registro de decisiones para medir qué tan bien funciona.
