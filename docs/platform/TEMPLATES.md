# Biblioteca de plantillas OBEY — estructura portable v1

T34 parcial: diez bases oficiales y plantillas privadas inmutables por propietario, dentro de Architect. La UI permite búsqueda sobre el catálogo disponible, guardar todos los recursos de la propuesta o solo los nuevos con sus dependencias, exportar/importar JSON OBEY, borrar una plantilla propia y añadirla como propuesta. La instalación básica utiliza el mismo preflight/copia/confirmación/job/mapa de IDs real; no hay ejecución al seleccionar ni previsualizar.

## Formato y alcance

`format: obey-template`, `schemaVersion: 1`, `scope: structure_only`, nombre/descripción, roles y canales. Tipos de canal 0/2/4, roles editables y sobrescrituras de roles con allow/deny íntegros. IDs/parent/overwrite targets usan referencias `local:`; `everyone` es un alias remapeado al guild destino. No se guarda guildId activo, snapshot de origen, sesiones, tokens ni configuración de módulos. Nombres y temas pueden contener texto del usuario; las referencias activas se validan por separado. Posiciones de canales 0 y roles 1 significan usar el orden predeterminado del proveedor. Se rechazan posiciones personalizadas en imports, en lugar de ignorarlas.

Captura normaliza IDs/posición sin rebajar bitfields. Everyone global y roles managed quedan fuera. Un member overwrite, referencia a un rol managed/desconocido, tipo avanzado o color de rol especial/desconocido bloquea la captura completa. La selección de nuevos recursos incluye automáticamente categorías y roles necesarios; el scope se informa en UI. Protecciones del origen no se transportan; las del destino se conservan. La configuración portable de welcome/verification/AutoMod/tickets/logging/levels/voice/automations sigue pendiente. No es una plantilla completa del maestro.

Import valida todos los campos y referencias, versión, tipo, límites y permisos mediante el validador común. Campos de módulos/secretos o IDs externos como referencias se rechazan. El formato nativo de Discord no se importa ni se ofrecen endpoints supuestos. Soporte/verificación de templates nativos pendiente.

## Preview e instalación

El digest del grafo genera referencias lógicas deterministas cortas. Preview vuelve a leer estructura/revisión actual y conserva la propuesta existente. Recursos compatibles se reutilizan por ID lógico o nombre/tipo/padre; sus atributos capturados deben coincidir. IDs reales se toman exclusivamente del destino. Conflictos, nombres ambiguos, colores especiales/desconocidos y expansión de categoría protegida bloquean la propuesta, sin reemplazar ni modificar esos recursos. Repetir la base en el borrador o sobre sus recursos reales compatibles no duplica estructura.

Después de preview, guardar usa el borrador privado; aplicar usa el motor existente con copia previa y confirmación explícita. El motor básico todavía no crea roles con grants ni canales/categorías con overwrites: una plantilla que los incluya conserva esos permisos, pero muestra el bloqueo al revisar/aplicar. No se elimina privacidad para hacer el plan ejecutable. También se conservan los límites de bitrate/capacidad/jerarquía y canary del motor.

## Persistencia y APIs

`ObeyTemplate` Mongo: UUID, ownerId, versión 1, definición inmutable y timestamps; índice ownerId/createdAt. Listar devuelve hasta las últimas 50 privadas del actor, además de oficiales; búsqueda local sobre esas filas, no búsqueda global paginada. No hay publicación comunitaria, ratings/favoritos ni historial de versiones todavía. Import crea copia privada nueva. Get/list/delete filtran propietario; otro actor recibe not found. Scope rechaza operadores/objetos antes de DB.

Bajo `/api/architect/:guildId`: GET templates; POST templates (captura), POST templates/import, GET templates/:templateId (export), POST templates/:templateId/preview y POST templates/:templateId/delete. Todos reutilizan OAuth/acceso fresco ManageGuild/CSRF/no-store del dominio. La identidad del propietario proviene de la sesión. La cuenta administradora puede usar su plantilla en otra guild administrable. Oficiales funcionan cuando el storage privado está indisponible. La biblioteca invalida respuestas pendientes y limpia su catálogo ante 401/403.

## Evidencia

Tests de codec/merge/servicio/API: referencias, permisos preservados, defaults explícitos, IDs largos, conflicts/protecciones, actor y body injection, formato ajeno y storage offline. Mongo real en verify-architect-storage comprueba persistencia/aislamiento/borrado privado y rechazo de inyección. Chromium con Express/EJS/CSRF/Mongo/Redis reales comprueba captura, export/import, otra cuenta denegada, preview en otra guild sin referencias del origen, repetición, borrado y móvil. Captura una plantilla nueva y la previsualiza/confirmar hacia un job real con creación de rol/categoría/texto/voz, copia/checkpoints/mapa de IDs, sin red Discord. Capturas templates-desktop.png/templates-mobile.png y jobs-browser.json.

Pendientes del maestro: configuración portable/remapeo de módulos, permisos de creación completos, más tipos/miembros/estilos y orden; templates nativos; biblioteca paginada/favoritos/versiones/publicación comunitaria; entrada Discord y aceptación canary.
