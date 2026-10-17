# Guía de migración del módulo profiles

Tarea `MOD-PROFILES`. Estado `audit_before_migration`. Destino propuesto `src/modules/profiles`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

- `database/schemas/UserProfileSchema.js`
- `handlers/membership-title.js`

Se encontró persistencia de perfil; falta comprobar qué operaciones y campos públicos la consumen. No equiparar schema con módulo completo.

## Recorrido objetivo y permisos

Miembro edita su perfil; terceros solo consultan campos visibles.

1. Abrir perfil propio.
2. elegir visibilidad y campos.
3. editar biografía/cosméticos autorizados.
4. preview.
5. guardar revisión.
6. renderizar perfil para audiencia.

## Fuente de verdad y límites

ProfileView DTO por campo; perfil propio, visible y staff explícitos

DTO propio puede incluir campos de configuración; DTO público omite saldo y preferencias privadas; ocultar no equivale a borrar datos.

Cosmético revocado usa fallback autorizado. Cambio de privacidad invalida caché y entrega posterior; enlace a imagen no debe dejar datos privados en CDN público.

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
| visibility | enum guild,private | guild | Miembro puede reducir visibilidad |
| cardTemplateId | referencia | plantilla base | No script del usuario |
| showBalance | boolean | false | Opt-in del miembro |
| bioMaxLength | int fijo | 160 | Sanear texto, sin menciones activas |
| cosmeticSlots | conjunto | background,badge,frame | Solo desbloqueados o predeterminados |

## Casos de aceptación escritos

### profiles FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo profiles.

Cuando Abrir perfil propio y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; renderizar perfil para audiencia.

### profiles RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando Una tarjeta se está renderizando cuando el miembro hace privado su perfil.

Entonces Antes de entregar se revalida audiencia/revisión; se descarta render anterior si filtra información.

### profiles RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Cosmético revocado usa fallback autorizado. Cambio de privacidad invalida caché y entrega posterior; enlace a imagen no debe dejar datos privados en CDN público.

### profiles PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. DTO propio puede incluir campos de configuración; DTO público omite saldo y preferencias privadas; ocultar no equivale a borrar datos.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.
