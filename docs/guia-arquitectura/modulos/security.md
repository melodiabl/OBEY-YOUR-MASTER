# Guía de migración del módulo security

Tarea `MOD-SECURITY`. Estado `audit_before_migration`. Destino propuesto `src/modules/security`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

- `handlers/anti_nuke.js`
- `handlers/antiselfbot.js`

La presencia de estas rutas no acredita el recorrido completo; conciliar operaciones, consumidores y datos.

## Recorrido objetivo y permisos

Gestor define protección; staff autorizado decide contención.

1. Instalar en observación.
2. ver señales y excepciones.
3. simular impacto.
4. activar protect explícitamente.
5. evaluar incidente.
6. aplicar solo política autorizada.
7. revisar recuperación.

## Fuente de verdad y límites

Incident, Signal, Mitigation, RestoreDiff con evidencia y revisión

Personal ve incidentes y motivos; miembros afectados reciben explicación permitida. La edad de cuenta es una señal y no una prueba de abuso.

Nunca bloquear al instalar por defaults nuevos. Revertir solo cambios capturados y todavía compatibles; no sobrescribir cambios legítimos posteriores.

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
| mode | enum observe,protect | observe | No bloqueo automático al instalar |
| joinThreshold | int | 10 | 3–1000 ingresos |
| joinWindowSeconds | int | 10 | 5–300 |
| minimumAccountAgeHours | int | 24 | Señal, no prueba de abuso |
| autoAction | enum alert,quarantine | alert | Quarantine exige rol configurado |
| trustedActorIds | snowflake[] | [] | Exención solo de regla seleccionada; siempre auditar |

## Casos de aceptación escritos

### security FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo security.

Cuando Instalar en observación y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; revisar recuperación.

### security RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando Incidente activa contención mientras un gestor cambia permisos legítimamente.

Entonces El diff de recuperación detecta la revisión nueva y pide conciliación en vez de restaurar a ciegas.

### security RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Nunca bloquear al instalar por defaults nuevos. Revertir solo cambios capturados y todavía compatibles; no sobrescribir cambios legítimos posteriores.

### security PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. Personal ve incidentes y motivos; miembros afectados reciben explicación permitida. La edad de cuenta es una señal y no una prueba de abuso.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.
