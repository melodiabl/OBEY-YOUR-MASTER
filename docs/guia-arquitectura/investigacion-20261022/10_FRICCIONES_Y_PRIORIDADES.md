# Fricciones y oportunidades de experiencia

Producto: OBEY; usuarios: miembros, DJ, staff, administradores y mantenedores. Horizonte: remodelación inicial y crecimiento posterior. Alcance: Discord primero, con web para configurar/consultar y facturación. Fuentes: reportes visibles del usuario, archivos de base previamente auditados, documentación oficial y siete archivos públicos revisados. No se accedió a soporte privado ni se midió frecuencia en una muestra de usuarios; no se inventa prevalencia.

| Prioridad | Problema / objetivo | Evidencia | Severidad y confianza | Frecuencia | Propuesta |
| --- | --- | --- | --- | --- | --- |
| 1 | Termina pista pero la escucha no continúa | Reportado por el usuario; patrón de transición comparado con Red/JMusicBot | Alta; fallo de OBEY pendiente de reproducción | Desconocida | Una autoridad de avance, motivos y revisión; paridad slash/botón |
| 2 | Logs incompletos o actor atribuido sin certeza | Siete hallazgos de base en capítulo 25; Quark separa contexto y acciones | Alta; evidencia estática y documental | Desconocida | Diff de varios campos, outbox, dato ausente y correlación con incertidumbre |
| 3 | Niveles o roles parecen «rotos» por configuración | Arcane documenta exclusiones como problema importante de soporte | Media/alta; alta para ese producto, sin extrapolar a OBEY | No medida para OBEY | Diagnóstico de fuente, exclusiones, jerarquía y destino efectivo |
| 4 | Estado visual confirma algo aún pendiente | Diferencia ACK/efecto; pasos de tickets y cobros asíncronos documentados | Alta para operaciones con efectos; evidencia de contratos | No medida | Pendiente, confirmado, parcial y desconocido, con recibo |
| 5 | Ejemplo de integración antiguo aplicado a API nueva | Top.gg v1 firma/eventos frente a ejemplo SDK con Authorization legacy | Alta para premios duplicados o falsos; alta documental | No medida | Versionar adaptador, validar raw body, proyecto y recibo |
| 6 | Idiomas/recursos fragmentados y emojis ausentes | Auditoría de recursos de base e i18n ES/EN actual | Media; alta estática, cobertura conectada pendiente | No medida | Resolvedor semántico, fallback, idiomas publicados por módulo |

Fuentes: [Arcane diagnóstico](https://docs.arcane.bot/plugins/leveling/debugging), [restricciones](https://docs.arcane.bot/plugins/leveling/setup/restrictions), [Top.gg v1](https://docs.top.gg/webhooks/overview), [ejemplo SDK](https://docs.top.gg/libraries/javascript), [Ticket Tool](https://docs.tickettool.xyz/dashboard/panel-configs/ticket-options). Código fijado en 02_CODIGO_PUBLICO.md; base en ../cobertura-eventos/.

Resolver primero continuidad y confianza en el resultado; después simplificar configuración y publicar materiales por recorrido. Medir tiempo hasta primer resultado útil, fallos por permisos, controles caducados, tasa de uso de fallback y recuperación tras error. Definir ventanas y denominadores antes de mostrar porcentajes. No recopilar texto de usuarios para una métrica de UX cuando basta un código de resultado.

Esta semana de implementación: reproducción del fallo, transición compartida y diagnóstico de configuración. Siguiente etapa: recorridos de tickets/logs, idiomas y permisos. Más investigación necesaria: capturas actuales de Mudae, detalles de Sapphire/Carl/FredBoat que no se recuperaron, costes reales de premium y capacidad medida por VPS. No dar por investigadas esas partes a fondo porque figuren en la muestra.
