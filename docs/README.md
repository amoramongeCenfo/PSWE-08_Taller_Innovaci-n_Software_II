# Documentación de Colibri

Aquí vive todo lo que explica **cómo está hecho** Colibri y **qué sigue**. La instalación y el uso diario están en el [README principal](../README.md).

| Documento                                                      | Para qué sirve                                                                  |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [Arquitectura](arquitectura.md)                                | Cómo está organizado el código, el estado global y el patrón de servicios       |
| [Convenciones](convenciones.md)                                | Reglas para escribir código nuevo: componentes, nombres, textos, calidad        |
| [Decisiones](decisiones.md)                                    | Qué se decidió, por qué y qué alternativas se descartaron                       |
| [Hoja de ruta](hoja-de-ruta.md)                                | Etapas del proyecto, qué está hecho y qué sigue                                 |
| [Servidor](servidor.md)                                        | Diseño del servidor: rutas, configuración, seguridad y estructura               |
| [Tutorial: Meta y WhatsApp](tutorial-meta-whatsapp.md)         | Guía de cero a cero: cuenta de desarrollador, número de prueba, túnel y webhook |
| [Plan: respuestas automáticas](plan-respuestas-automaticas.md) | "Contesta solo": fases y contrato con el área de análisis                       |
| [Guía del analizador de mensajes](analizador-de-mensajes.md)   | Cómo conectar y probar el analizador del área de análisis                       |
| [Integración con Instagram](integracion-instagram.md)          | Configuración de Instagram Direct y cómo se conecta con Colibri                 |
| [Integración con Messenger](integracion-messenger.md)          | Configuración de Facebook Messenger y cómo se conecta con Colibri               |
| [Integración con WhatsApp](integracion-whatsapp.md)            | Configuración en Meta paso a paso y cómo se conecta con Colibri                 |

## Cómo mantener esta documentación

- Cuando tomes una decisión importante, agrégala a [Decisiones](decisiones.md).
- Cuando termines una etapa, márcala en la [Hoja de ruta](hoja-de-ruta.md).
- Si cambias un contrato (por ejemplo, un servicio que el cliente usa), actualiza [Arquitectura](arquitectura.md) en el mismo cambio.
- Escribe en español, con frases cortas, y explica el **porqué** además del **qué**.
