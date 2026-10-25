# P0 · kick y timeout · 25/10/2026

Kick y timeout texto/slash, junto a removetimeout prefix, usan ahora el mismo servicio de ejecución por miembro. La comprobación de acceso que ya usaba ban se extrae a `member-access`, compartida por las cuatro acciones; ban conserva su contrato. Se retiran los tres bloques prefix inline y se conserva la orquestación actual. [Evidencia](evidence/p0-member-actions-20261025.json).

Se refrescan roles de la guild, actor, bot y objetivo; se comprueban permisos nativos del bot y las capacidades SDK de expulsión, timeout o gestión para retirada. La jerarquía exige un orden SDK válido. Prefix conserva Administrator, propietarios y concesiones adminroles/cmdadminroles por rol o usuario; KickMembers/ModerateMembers nativo solo no amplía prefix. Slash mantiene sus permisos nativos y la excepción del propietario. ID, objetivo protegido, fallo de lectura, miembro ausente, orden incierto o apagado deniegan la mutación.

La expulsión recibe un motivo string, y el timeout una duración entera validada. Cada término de la duración compuesta debe ser positivo y producir milisegundos enteros; se rechazan partes vacías, negativas, cero, fracciones de milisegundo, overflow y valores superiores al límite. Prefix conserva hasta 28 días y rechaza un timeout activo; un timestamp ya vencido no lo bloquea. Slash mantiene opciones hasta 7 días y su capacidad existente de actualizar un timeout activo. La respuesta muestra unidades legibles es/en, con fallback español.

Retirar timeout requiere un plazo activo recién leído y envía `null`, según el contrato SDK. Se espera la respuesta de Discord antes de confirmar o notificar. Después se cierran únicamente los registros de timeout activos del mismo servidor/usuario, con el corte temporal anterior a la petición y compatibilidad con filas sin campo `createdAt`. Se reutiliza el mismo cierre acotado para desbaneo. No se crean casos de retirada ni se elimina historia; una escritura fallida/no confirmada produce un aviso independiente de la retirada confirmada.

Se mantienen contadores (`kick` o `mute`), DM y adminlog opcional después del efecto; cada uno tiene presupuesto de confirmación y fallo separado. El destino de log ausente no borra ajustes. Prefix kick/timeout no se convierte en una nueva fuente de casos: slash conserva `ModerationSchema`, y la reconciliación general queda en P2. Las respuestas suprimen menciones, acotan Unicode y conservan el footer. Los errores compartidos dejan de hablar de ban/desbaneo cuando se refieren a otra acción.

## Verificación y límites

La reproducción inicial obtuvo 27 fallos y 21 aprobados en 48 escenarios; no se cuentan como 27 bugs distintos. El candidato ampliado pasa **122 casos: 97 temporales y 25 originales**, ninguno omitido. Incluye respuestas retenidas/rechazadas, permisos frescos, grants, jerarquía, lookup, apagado, SDK args, duraciones compuestas/inválidas, estado activo/vencido, historial acotado, errores auxiliares, idioma y regresiones de las cuatro rutas de ban y desbaneo.

Pruebas sin red, con permisos/colecciones/embeds reales y efectos Discord/Mongo simulados. Tipos y fronteras pasan. Auditoría del lockfile: 36 moderate, cero low/high/critical, sin cambios de dependencias. Se revisó el código instalado y la documentación de [GuildMember](https://discord.js.org/docs/packages/discord.js/14.25.1/GuildMember%3AClass) y [Modify Guild Member](https://docs.discord.com/developers/resources/guild#modify-guild-member) para motivo de expulsión, retirada con null y límite nativo.

No se añaden comandos, endpoints ni un timeout-removal slash. No hay recibos duraderos o coordinación estricta entre timeout/removal/ban: escrituras y notificaciones pendientes pueden terminar después de su aviso de incertidumbre. Historias, logs canónicos y aceptación autenticada siguen abiertos; no se ejecutan sanciones reales de prueba.

El mapa llega a **27 grupos, 114 entradas y 21 rutas**. Quedan **561 entradas y 74 rutas**, incluidas 55 de Administración. G01/G02 siguen abiertos. La siguiente unidad P0 es el historial de advertencias, sus permisos y visibilidad; los mutes basados en roles permanecen como intención distinta.

Estado: comprobado en aislamiento; construcción y despliegue pendientes. Se retirarán los verificadores tras conservar la evidencia.
