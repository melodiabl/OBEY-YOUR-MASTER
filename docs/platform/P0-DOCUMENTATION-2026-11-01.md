# P0-C4 · documentación pública G25 · 01/11/2026

Se concilió la documentación pública con el checkout posterior a `746647ab`, conservando el código desplegado `2355287f` y su imagen. **G25 y P0 permanecen abiertos:** falta confirmar un canal de soporte vigente y un contacto privado para vulnerabilidades. No se cambió la configuración del repositorio remoto, se publicaron mensajes ni se reinició el bot.

## Hallazgos y correcciones

El README anterior prometía un dashboard completo, recomendaba Administrador para el bot, usaba recuentos antiguos, una plantilla `.env.example` inexistente y el perfil Lavalink `managed-lavalink`, que ya no es el perfil del Compose. Incluía SoundCloud y otros proveedores retirados, ejemplos de idioma/prefijo que no correspondían a las entradas vigentes, actualización desde `master` y afirmaciones de hosting/patrocinio sin prueba actual.

El README nuevo enlaza instalación, uso, arquitectura actual, plan, soporte, seguridad, contribuciones y avisos. Se documentan Node22.23.4, los dos lockfiles, las claves vigentes y su precedencia, OAuth/puerto3002, registro de nodos TLS, el privado opcional con perfil `manual-lavalink`, persistencia global y los montajes. La guía distingue el checkout local del remoto, la sincronización real de slash al iniciar y las comprobaciones sin efectos. No promete un arranque nuevo contra servicios externos ni una aceptación funcional de todos los comandos.

La guía de uso presenta `/setup` como entrada central, ayuda, música y los corazones de OBEY con `/playlist list`. Next/React se describe como migración parcial junto a EJS. Las entradas de lectura del paquete 0.15 y la revisión documental reciben avisos de contexto histórico; no se borran las especificaciones, la investigación ni sus exclusiones.

El README anterior y la configuración de financiación de upstream se conservan byte a byte en `docs/history/`. La financiación antigua deja de estar activa en `.github/FUNDING.yml`, sin proponer donaciones nuevas. LICENSE permanece intacta. THIRD_PARTY_NOTICES enlaza los avisos presentes de la base, imágenes, fuentes, iconos, Chart.js y referencias de investigación. Los materiales aprobados/propuestos y las capturas ajenas conservan sus límites; no se publica un mockup como captura del producto.

Las cuatro plantillas de incidencias dejan de asignar al autor anterior, usar ejemplos de releases antiguas, enlazar una wiki ajena como instalación o aplicar invalid/wontfix automáticamente. Se aclara que las plantillas no habilitan Issues.

## Soporte comprobado y pendiente

La consulta de solo lectura al repositorio mediante el conector GitHub confirma `has_issues:false`, `has_discussions:false` y solicitudes de cambios disponibles. La página `/issues` responde HTTP200: por sí sola **no** acredita que se puedan crear incidencias. El endpoint Discord de la invitación anterior devuelve HTTP404. La página WhatsApp responde HTTP200, sin confirmar titularidad, atención o confidencialidad. El formulario de advisory redirige a login: no acredita Private Vulnerability Reporting habilitado. Tampoco hay destinos SUPPORT_SERVER/PROJECT_CONTACT_URL configurados en el entorno operativo consultado.

SUPPORT y SECURITY explican el estado real y no inventan email, invitación o SLA. Se solicitó al mantenedor el destino público y el contacto privado; la ausencia de respuesta no se interpreta como autorización para publicar uno. El contenido de documentación está corregido, pero este requisito de G25 sigue sin aceptación. No se activaron Issues/Discussions/Private Vulnerability Reporting como efecto de la auditoría.

## Verificación

Pasan 72 destinos locales de los nueve documentos públicos principales, ocho bloques shell por sintaxis, el ejemplo JSON de nodos con el validador real sin red, cinco scripts npm referenciados y el YAML de las cuatro plantillas. LICENSE y los dos documentos históricos comparan exactamente con su fuente. La comprobación de whitespace pasa en el contenido nuevo; la copia exacta del README conserva sus cuatro saltos Markdown originales de dos espacios, excluidos explícitamente de esa comprobación para no modificar el archivo histórico. El gate permanente mantiene 661 comandos/95 rutas/27 capacidades; la revisión funcional queda en 52 grupos/168 comandos/34 rutas, sin promover negocio.

No se ejecuta de nuevo una instalación, tests o build del bot por cambiar Markdown y plantillas; G01/G02 conservan su corte final en C5. Se conservan los tres tests originales. No se añade ningún script de pruebas/verificación temporal al repositorio. Los resultados y destinos consultados se resumen en [la evidencia](evidence/p0-documentation-20261101.json).

Siguiente: confirmar contactos reales de G25 y completar el corte G01/G02/G25. C2 conserva además la rotación Mongo pendiente en el proveedor; una entrega de documentación no la sustituye. P1 música continúa después de la aceptación de P0, según el plan original.
