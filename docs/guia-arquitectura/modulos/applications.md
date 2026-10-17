# Guía de migración del módulo applications

Tarea `MOD-APPLICATIONS`. Estado `audit_before_migration`. Destino propuesto `src/modules/applications`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

- `handlers/apply.js`
- `handlers/tickets/application-buttons.js`

Se encontraron handlers de solicitudes. Comprobar tipos de formulario, persistencia y revisores; no confundirlos con planes de aplicación de Architect.

## Recorrido objetivo y permisos

Solicitante completa propia solicitud; revisor autorizado decide.

1. Elegir formulario publicado.
2. fijar versión de preguntas.
3. completar pasos.
4. validar.
5. enviar.
6. bloquear edición según política.
7. revisión.
8. decisión.
9. rol autorizado si aplica.

## Fuente de verdad y límites

ApplicationForm revisionado, Submission, Review y RoleGrant separado

Respuestas y notas no son públicas. Revisor solo accede si mantiene rol/capacidad; solicitante ve estado y mensaje de decisión permitido.

Expiración conserva estado coherente sin enviar una solicitud incompleta. Aceptar y asignar rol tienen recibos separados; rol fallido no anuncia concesión exitosa.

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
| questions | lista versionada | [] | Propuesta 1–20; dividir en pasos compatibles |
| reviewerRoleIds | lista | [] | Obligatoria para activar |
| completionMinutes | int | 60 | Propuesta 5–1440 |
| roleActions | mapa | {} | Permisos y jerarquía al aplicar |
| retentionDays | int | 90 | Propuesta 7–365 |

## Casos de aceptación escritos

### applications FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo applications.

Cuando Elegir formulario publicado y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; rol autorizado si aplica.

### applications RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando Dos revisores toman decisiones opuestas sobre la misma revisión.

Entonces Una decisión gana; el otro recibe estado actual y no aplica una segunda acción de rol.

### applications RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Expiración conserva estado coherente sin enviar una solicitud incompleta. Aceptar y asignar rol tienen recibos separados; rol fallido no anuncia concesión exitosa.

### applications PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. Respuestas y notas no son públicas. Revisor solo accede si mantiene rol/capacidad; solicitante ve estado y mensaje de decisión permitido.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.
