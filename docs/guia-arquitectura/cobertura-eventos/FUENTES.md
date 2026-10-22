# Fuentes de cobertura y límites

Consulta 22/10/2026, America/Asuncion. Documentación primaria y su fuente pública discord/discord-api-docs; hashes de las versiones consultadas en proveniencia.json.

- [Gateway Events](https://docs.discord.com/developers/events/gateway-events): índice de recepción y campos de eventos. Eliminación de mensaje identifica recurso; no entrega cuerpo borrado.
- [Gateway](https://docs.discord.com/developers/events/gateway): selección de intents, requisitos privilegiados y mecanismos de conexión/resume. Declarar un intent no acredita acceso productivo.
- [Audit Log](https://docs.discord.com/developers/resources/audit-log): acciones administrativas, cambios y actor opcionales, permiso de lectura y retención documentada de 45 días.

Las tablas de fuentes distinguen nombres de recepción Gateway de códigos de auditoría; no se asume correspondencia uno a uno. Puede haber diferencias de nombre entre changelog, SDK y tabla de auditoría; conservar código/versión de origen y resolver compatibilidad. En particular no construir la clave de acción por convertir mecánicamente un nombre del changelog.

Las descripciones de producto, arquitectura, niveles de captura, política de correlación, fallos y pruebas son diseño OBEY. El lector debe validar campos/exports del SDK al implementar. No se consultó código privado de Quark ni su historial de Discord. Los 117 materiales previos no son un inventario completo de emojis originales de Quark.
