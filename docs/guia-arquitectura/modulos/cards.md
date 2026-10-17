# Guía de migración del módulo cards

Tarea `MOD-CARDS`. Estado `audit_before_migration`. Destino propuesto `src/modules/cards`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

- `dashboard/cards-routes.js`
- `handlers/card-assets.js`
- `handlers/card-background.js`
- `handlers/card-delivery.js`
- `handlers/card-job.js`
- `handlers/card-media.js`
- `handlers/card-pool.js`
- `handlers/card-renderer.js`
- `handlers/card-worker.js`
- `handlers/cards-runtime.js`
- `handlers/cards.js`
- `handlers/cards/leaderboard.js`
- `handlers/cards/rankcard.js`

La presencia de estas rutas no acredita el recorrido completo; conciliar operaciones, consumidores y datos.

## Recorrido objetivo y permisos

Gestor edita plantilla; renderer recibe DTO permitido por audiencia.

1. Elegir tipo y tamaño.
2. seleccionar fondo/avatares autorizados.
3. completar texto y slots.
4. validar.
5. preview.
6. fijar versión publicada.
7. renderizar por evento.

## Fuente de verdad y límites

CardTemplate y RenderInput versionados; assets/fonts locales y cache por revisión

Tarjetas de bienvenida/despedida/nivel/perfil comparten motor pero no DTO. Texto y avatar deben recortarse sin revelar campos que la audiencia no puede ver.

Fuente/imagen fallida usa fallback; render tiene presupuesto y timeout. No aceptar scripts ni URLs arbitrarias sin validación y política de proveedores.

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
| canvasPreset | enum welcome,profile | welcome | Dimensiones y safe area por preset |
| backgroundAssetId | referencia nullable | null | Archivo validado, no URL libre al renderer |
| layers | lista | [] | text,image,avatar,shape; zIndex explícito |
| fontKey | enum | fuente local existente | No cargar fuente remota arbitraria |
| safeTextFallback | string | obligatorio | Mismos datos importantes que imagen |
| maxLayers | int fijo | 20 | Límite inicial de producto |

## Casos de aceptación escritos

### cards FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo cards.

Cuando Elegir tipo y tamaño y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; renderizar por evento.

### cards RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando La plantilla cambia mientras un job de bienvenida espera render.

Entonces El job usa versión fijada o política explícita de actualización; la mezcla de dos versiones se evita.

### cards RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Fuente/imagen fallida usa fallback; render tiene presupuesto y timeout. No aceptar scripts ni URLs arbitrarias sin validación y política de proveedores.

### cards PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. Tarjetas de bienvenida/despedida/nivel/perfil comparten motor pero no DTO. Texto y avatar deben recortarse sin revelar campos que la audiencia no puede ver.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.
