# Guía de migración del módulo templates

Tarea `MOD-TEMPLATES`. Estado `audit_before_migration`. Destino propuesto `src/modules/templates`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

- `database/schemas/TemplateSchema.js`
- `handlers/templates/format.js`
- `handlers/templates/merge.js`
- `handlers/templates/repository.js`
- `handlers/templates/service.js`

La presencia de estas rutas no acredita el recorrido completo; conciliar operaciones, consumidores y datos.

## Recorrido objetivo y permisos

Autor guarda plantilla; gestor aplica versión compatible.

1. Elegir kind.
2. capturar datos permitidos.
3. validar schema.
4. guardar versión.
5. preview de destino.
6. delegar al servicio de estructura/mensaje/tarjeta.
7. confirmar allí.

## Fuente de verdad y límites

Template tipo/versión/alcance; mapeo de referencias y ownership

Plantilla privada solo autor/equipo autorizado; compartir no concede gestión del servidor. Importar valida y nunca aplica.

Versión publicada inmutable. Dependencia faltante impide aplicar; compatibilidad structure_only v1 se conserva, nuevos kinds no se mezclan con import viejo.

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
| kind | enum structure,message,card | obligatorio | Enruta al servicio especializado |
| visibility | enum guild,private | guild | Público/marketplace queda fuera inicial |
| version | entero inmutable | 1 | Nueva publicación crea versión |
| tags | string[] | [] | Máximo10,24 caracteres cada una |
| requiredModules | ID[] | [] | Validar antes de usar |
| importPolicy | enum validate_only | validate_only | Importar nunca aplica al servidor |

## Casos de aceptación escritos

### templates FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo templates.

Cuando Elegir kind y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; confirmar allí.

### templates RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando Se publica otra versión mientras el gestor confirma la aplicación anterior.

Entonces Se aplica la versión fijada en el preview o se pide revisar la nueva, nunca cambia silenciosamente.

### templates RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Versión publicada inmutable. Dependencia faltante impide aplicar; compatibilidad structure_only v1 se conserva, nuevos kinds no se mezclan con import viejo.

### templates PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. Plantilla privada solo autor/equipo autorizado; compartir no concede gestión del servidor. Importar valida y nunca aplica.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.
