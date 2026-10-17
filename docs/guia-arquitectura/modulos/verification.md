# Guía de migración del módulo verification

Tarea `MOD-VERIFICATION`. Estado `deferred_no_confirmed_domain`. Destino propuesto `src/modules/verification`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

No se confirmó una ruta de dominio. La primera tarea es investigar consumidores; no iniciar una implementación nueva por este documento.

No se confirmó un dominio general de verificación de acceso mediante las rutas revisadas. La presencia de una verificación de un juego no prueba este módulo. Auditar antes de diseñar o implementar un reemplazo.

## Recorrido objetivo y permisos

Miembro pendiente completa desafío propio; staff revisa excepciones.

1. Mostrar reglas.
2. emitir desafío con vencimiento.
3. comprobar respuesta e intentos.
4. conceder rol verificado.
5. retirar concesión pendiente del mismo origen.
6. confirmar acceso.

## Fuente de verdad y límites

VerificationChallenge y RoleGrant; código secreto fuera del DTO web

Desafío privado por miembro; staff ve resultado e intentos, no una solución reutilizable. Confirmar reglas no prueba ausencia de cuentas alternativas.

Respuesta vencida ofrece nuevo desafío sin conceder acceso; rol eliminado bloquea concesión. Timeout no expulsa salvo política explícita avanzada.

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
| mode | enum button,challenge | challenge | Button confirma reglas; no se vende como antialts |
| pendingRoleId | snowflake nullable | null | No rol administrable por miembro |
| verifiedRoleId | snowflake | sin valor | Obligatorio para habilitar |
| challengeTtlSeconds | int | 300 | 60–900 |
| maxAttempts | int | 3 | 1–10 |
| timeoutAction | enum none,request_kick,kick | none | request_kick requiere revisión; kick automático solo habilitación avanzada explícita |

## Casos de aceptación escritos

### verification FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo verification.

Cuando Mostrar reglas y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; confirmar acceso.

### verification RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando Dos respuestas correctas del mismo desafío llegan juntas.

Entonces Un solo commit concede el rol; la segunda respuesta devuelve el resultado confirmado.

### verification RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Respuesta vencida ofrece nuevo desafío sin conceder acceso; rol eliminado bloquea concesión. Timeout no expulsa salvo política explícita avanzada.

### verification PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. Desafío privado por miembro; staff ve resultado e intentos, no una solución reutilizable. Confirmar reglas no prueba ausencia de cuentas alternativas.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.
