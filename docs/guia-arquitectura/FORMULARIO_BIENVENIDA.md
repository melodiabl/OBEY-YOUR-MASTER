# Formulario declarativo de bienvenida · TECH-04

Entrega local del 18/10/2026 sobre 47e01fa, continuación del [piloto](PILOTO_BIENVENIDA.md). Canal y mensaje conservan su escritor y almacenamiento. Implementación local y comprobación aislada del editor; recorrido OAuth/Discord de producción pendiente.

## Conducta y archivos

handlers/welcome/ui.js declara orden, componentes y claves de traducción de los dos campos. Lee tipos, null permitido y máximo desde el JSON Schema derivado del contrato Zod; no añade otro límite manual. El parcial reutilizable dashboard/views/includes/configuration-fields.ejs presenta selectores de canal y mensajes de plantilla con label, ayuda y error vinculados. La página configuration-editor.ejs conserva las secciones de publicado, borrador, diferencias y preview. No se cambian tarjetas, DM, segundo canal, landing ni música.

El cliente lee nombres y nulabilidad de los controles declarados; el vacío del selector se envía como null y el texto vacío sigue siendo texto. El navegador usa maxlength como ayuda; la validación autorizada continúa en el servicio. /welcome mensaje también usa el contrato para su comprobación rápida. Modificar el máximo requiere cambiar el contrato; el formulario, su ayuda y el guardado/guardia del slash comparten esa fuente. Añadir otro campo sigue requiriendo una decisión de almacenamiento, descriptor y adaptación de negocio; no se presenta como generación automática de capacidades.

Los catálogos locales/es.json y locales/en.json contienen 50 claves de editor y cinco de campos/ayuda cada uno. Se reutiliza i18n existente con fallback; los demás textos legacy del panel no se declaran traducidos por esta entrega. La región del editor identifica es/en para accesibilidad. JSON del catálogo escapa < antes de incluirse en HTML y el texto de usuario se presenta con textContent.

Descartar cambios locales vuelve a la publicación o al borrador guardado ya cargado: no borra el borrador persistido. Un conflicto mantiene el texto y exige actualizar/comparar. Errores por campo dirigen foco al control y se enlazan por aria-describedby/aria-invalid; el aviso anterior se retira al editar. Deshabilitar botones durante una operación evita envíos repetidos.

## Revocación y contrato de error

Se reprodujo antes del cambio: un 403 configuration_permissions por gestor revocado conservaba la configuración privada visible. La política ahora distingue la pérdida confirmada de acceso del actor de un problema del canal. Mantiene los códigos HTTP y error existentes y añade accessRevoked:true cuando corresponde; errors de validación pueden incluir fields, limitada a channelId/message. No expone issues completos, payload, mensajes de proveedores o credenciales.

El resolver de canales utiliza la misma política para evitar que su respuesta 403 gane la carrera de carga y se clasifique erróneamente como fallo del canal. El cliente limpia publicado, borrador local, opciones, diff, preview y estado en memoria al perder acceso. Falta de permisos del bot/canal conserva los cambios. Un fallo de red sin confirmación no se etiqueta como revocación. Miembro inexistente o acceso perdido se clasifican mediante constantes del SDK verificadas contra [los códigos oficiales de Discord](https://docs.discord.com/developers/topics/opcodes-and-status-codes); comprobación aislada de ambas condiciones y error transitorio.

El contrato detallado se entrega en las rutas del editor de módulos. Los endpoints compatibles anteriores conservan su forma y no se presentan como un editor migrado a estos metadatos. No se modifica el formato de los documentos Guild ni se ejecuta migración.

## Verificación y evidencia

- npm run typecheck:welcome pasa; se añade ui.js al ámbito explícito de @ts-check. No se declara tipado del dashboard entero.
- npm test: los 25 casos originales pasan. Se conservan tres archivos de tests, sin nuevos verificadores en test o scripts.
- Doce escenarios de navegador real: límite derivado; borrador sin activar y doble envío; conflicto entre dos pestañas; comparación/descarte; preview como texto; confirmación; fallo de permisos del canal y reintento con el mismo operationId; respuesta perdida después de publicar y conciliación sin repetir escritura; fallo de almacenamiento conservando cambios; errores por campo con foco; cuatro anchos/teclado; es/en; revocación; y fallo inicial que sale de carga. Algunos escenarios agrupan varias de estas comprobaciones.
- Anchos 320/768/1024/1440 sin desbordamiento. Capturas verificadas después de terminar las transiciones de navegación. Labels/ayudas y foco comprobados; no se afirma certificación WCAG ni auditoría completa con lector de pantalla.
- Permisos Discord y sesión del entorno son fixtures. Se usaron servicios reales del proyecto, CSRF y Mongo aislado en loopback, sin cargar configuración privada ni iniciar el bot. Las bases vacías creadas para cada intento se eliminan al cerrar el fixture.
- Chrome DevTools MCP no pudo arrancar como root; se utilizó Chromium aislado con un controlador ya disponible fuera del proyecto. El primer intento de dos pestañas quedó interrumpido; la ejecución final completa pasó. No se cuentan intentos incompletos como éxitos.
- Cero errores JavaScript y solicitudes de red inesperadas. Ocho mensajes de consola corresponden a fallos HTTP provocados expresamente. Dos advertencias de precarga de fuentes proceden del header compartido sin cambios; se registran aparte, sin declarar consola completamente limpia.
- Comprobaciones adicionales: paridad de claves es/en, escape del JSON/EJS, límite UTF-16 del slash y detalle de revocación/errores. Los programas de prueba viven temporalmente fuera del repositorio y se retiran tras guardar evidencia.

[Resultados y hashes](../platform/evidence/welcome-form/browser.json), [escritorio](../platform/evidence/welcome-form/desktop.png), [móvil](../platform/evidence/welcome-form/mobile.png), [error de campo](../platform/evidence/welcome-form/field-error.png), [acceso revocado](../platform/evidence/welcome-form/revoked.png).

## Revisión, límites y reversión

Revisión propia: sin frameworks/dependencias nuevas, transporte arbitrario desde descriptores, segundo escritor ni valores privados en las capturas. Se preservan el diseño/recursos actuales y las dos capacidades existentes. Los permisos se resuelven en servidor y los fallos confirmados se distinguen de un resultado desconocido.

TECH-04 queda implementado y verificado localmente para canal/mensaje. Persisten OAuth/Discord reales, ciclo de vida TECH-05, reglas persistentes de imports/API TECH-06 y el resto de welcome. No hay publicación remota ni despliegue. Revertir el commit de este formulario restaura UI/error metadata anteriores; los datos y publicaciones existentes siguen compatibles y no deben borrarse. El máximo del contrato no se cambió.
