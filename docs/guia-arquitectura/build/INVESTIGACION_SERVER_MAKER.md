# Referencia funcional: Server Maker

Consulta: 21/10/2026, America/Asuncion. Referencia identificada por el bot de las capturas, aplicación `1233001713242476678`. El usuario escribió «Server Market»; la interpretación es Server Maker y queda registrada para poder corregirla si aporta otro enlace.

## Fuentes primarias y qué acreditan

| Fuente | Observación resumida | Aplicación a OBEY |
| --- | --- | --- |
| [Sitio del autor](https://servermaker.xyz/) | Presenta construcción por descripción, cambios de apariencia y clonación; muestra ejemplos de mensajes | Inspiración funcional para un centro de construcción propio |
| [Documentación del autor](https://servermaker.xyz/docs) | Describe centro `/maker`, preview de IA, creación puntual, plantillas, copias, clonación y temas; contiene ejemplos representados de la interfaz | Adaptar el recorrido propuesta → revisión → confirmación y conectar módulos existentes |
| [Funciones del autor](https://servermaker.xyz/features) | Presenta generación, estilizado, clonación y herramientas de recuperación | Separar capacidades y declarar cobertura real |
| [Términos del autor](https://servermaker.xyz/terms) | Advierten que build, clone y revamp pueden borrar estructura y que datos borrados no se recuperan | OBEY empieza con creación aditiva y conserva recursos por defecto |
| [Discord: interacciones](https://docs.discord.com/developers/interactions/receiving-and-responding) | Respuesta inicial dentro de 3 segundos y tokens de interacción válidos durante 15 minutos | Defer temprano, jobs durables y reabrir progreso |
| [Discord: rate limits](https://docs.discord.com/developers/topics/rate-limits) | Límites por buckets y tratamiento de 429 mediante Retry-After / retry_after | Coalescer ediciones y respetar la planificación REST |
| [Discord: permisos](https://docs.discord.com/developers/topics/permissions) | Permisos efectivos, overwrites y restricciones de jerarquía para bots | Preflight antes y durante los efectos |

Las funciones anteriores son declaraciones públicas del autor; no se ejecutaron en su bot ni se inspeccionó su código privado. Los ejemplos de la documentación son ilustrativos, algunos con fechas futuras respecto a la consulta. No constituyen capturas verificadas de una sesión actual de Discord.

Hay diferencias entre páginas respecto a cuotas, voto y cobertura de recuperación. No se trasladan a OBEY precios, cifras comerciales ni promesas de reversión. Las decisiones del capítulo 20 son diseño propio basado en las necesidades del proyecto. No se copian marca, textos ni archivos del competidor.

## Qué se adopta y qué se mejora

Adoptar acceso central, construcción guiada, propuesta previa, creación granular, temas y reutilización de plantillas. En OBEY todos pasan por Architect, los mismos permisos y una sola autoridad de ejecución. La integración con bienvenida/tickets/logs/música se publica mediante el módulo que posee cada configuración.

El plan propio hace explícitos revisión, conservación de IDs, resultados parciales, operaciones inciertas y límites del respaldo. No promete restaurar mensajes borrados ni garantizar velocidad al margen de Discord. Su alcance exacto y el orden de implementación están en [capítulo 20](../sistema/20_BUILD_Y_REMODELACION.md).

## Evidencia local

Lectura de los servicios Architect, application, creations, permissions, wizard, templates/format, worker de ediciones, inicializador, schemas y rutas. Los hashes de archivos consultados están en [alcance.json](alcance.json). Inspección estática; no se ejecutó el bot ni se probó el servicio externo. La base es el ZIP versión 6 (edición 0.7), no un nuevo checkout remoto.
