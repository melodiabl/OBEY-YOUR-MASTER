# Guía de migración del módulo utilities

Tarea `MOD-UTILITIES`. Estado `audit_before_migration`. Destino propuesto `src/modules/utilities`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

- `dashboard/help-routes.js`
- `handlers/help.js`
- `handlers/helpui.js`
- `handlers/project/bot-info.js`
- `handlers/project/discord-rest.js`
- `handlers/project/info.js`
- `handlers/project/ping.js`
- `handlers/utilities.js`

La presencia de estas rutas no acredita el recorrido completo; conciliar operaciones, consumidores y datos.

## Recorrido objetivo y permisos

Miembro consulta ayuda propia; gestor diagnóstico/configuración.

1. Leer registro real.
2. filtrar capacidades y permisos.
3. buscar función.
4. mostrar uso/requisitos.
5. enlazar configuración accesible.
6. distinguir función no instalada.

## Fuente de verdad y límites

CommandCatalog y CapabilitySnapshot con estado comprobado

Ayuda no muestra rutas de operador ni credenciales; el diagnóstico es privado y diferencia desconocido de fallo.

Proveedor no comprobado se marca así; no hacer pruebas de escritura para declarar salud. No registrar otro comando equivalente si existe alias canónico.

## Pasos concretos de reorganización

1. Relacionar cada entrada real con una acción de negocio. Leer los archivos candidatos y completar referencias adicionales; esta lista no es un grafo exhaustivo.
2. Identificar la colección o estado propietario y los efectos externos de esa acción. Registrar todo acceso directo que deba migrar.
3. Extraer el caso de uso pequeño y sus políticas. Si ya hay un servicio, adaptarlo; no crear otro con nombre distinto.
4. Hacer que una entrada delegue y comprobar permiso, efecto y respuesta. Migrar las demás superficies ofrecidas, conservando aliases y customIds.
5. Mantener un adaptador legacy hasta no encontrar consumidores. Aislar el acceso al cliente global detrás de ese adaptador cuando sea necesario.
6. Separar cambios de archivos y cambios de datos. Si hace falta migración, escribir mapping, checkpoint, lectura compatible y rollback antes de ejecutar.
7. Retirar lógica vieja con evidencia de referencias y recorrido; no eliminarla por tener una carpeta nueva.

## Configuración objetivo por conciliar

Campos de diseño de los contratos anteriores. No son claves runtime confirmadas: registrar clave legacy, tipo real, valor existente y fuente canónica antes de adaptarlos. Preservar ausente, null y false como estados distintos.

| Campo | Tipo | Default de diseño | Regla del contrato |
| --- | --- | --- | --- |
| enabledCommands | conjunto IDs existentes | conservar | Inventariar antes de cambiar |
| helpVisibility | enum available,all | available | Disponible según usuario/contexto |
| ephemeralDefault | boolean | true | Información sensible privada |
| commandCooldownSeconds | int | 3 | Excepciones por comando documentadas |
| locale | string | es | Compartida con servidor |

## Casos de aceptación escritos

### utilities FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo utilities.

Cuando Leer registro real y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; distinguir función no instalada.

### utilities RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando Un permiso se revoca después de abrir un menú de ayuda con acción administrativa.

Entonces La acción se rechaza al ejecutar y se actualiza la vista; el menú no concede autoridad.

### utilities RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Proveedor no comprobado se marca así; no hacer pruebas de escritura para declarar salud. No registrar otro comando equivalente si existe alias canónico.

### utilities PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. Ayuda no muestra rutas de operador ni credenciales; el diagnóstico es privado y diferencia desconocido de fallo.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.
