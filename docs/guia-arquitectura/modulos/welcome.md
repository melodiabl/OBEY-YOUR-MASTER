# Guía de migración del módulo welcome

Tarea `MOD-WELCOME`. Estado `configuration_pilot_local; full_module_pending`. Destino propuesto `src/modules/welcome`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

- `dashboard/welcome-routes.js`
- `handlers/configuration-service.js`
- `handlers/configuration.js`
- `handlers/leave.js`
- `handlers/welcome-access.js`
- `handlers/welcome-configuration.js`
- `handlers/welcome-message.js`
- `handlers/welcome.js`

La presencia de estas rutas no acredita el recorrido completo; conciliar operaciones, consumidores y datos.

## Recorrido objetivo y permisos

Gestor configura; miembro del evento es destinatario.

1. Elegir destino de entrada y salida por separado.
2. editar texto y tarjeta.
3. revisar variables.
4. preview sintético.
5. publicar configuración.
6. procesar ingreso una sola vez.

## Fuente de verdad y límites

WelcomeConfig revisionada; preservar aliases y mensajes ya guardados

Preview solo gestores; público según canal elegido; DM únicamente al miembro destinatario y cuando esté habilitado.

Fallo de imagen permite texto legible según política; fallo DM se registra aparte. Reingreso es otra sesión; verificación puede posponer la bienvenida.

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
| joinChannelId | snowflake nullable | null | Debe pertenecer al servidor y permitir envío |
| leaveChannelId | snowflake nullable | null | Destino independiente |
| dmEnabled | boolean | false | DM fallido no anula bienvenida pública |
| messageTemplateId | referencia | plantilla base | Variables permitidas por evento |
| cardTemplateId | referencia nullable | null | Render separado del texto |
| mentionMember | boolean | true | Solo el miembro del evento; nunca everyone por sustitución |
| deliveryMoment | enum | after_verification si activa; on_join en otro caso | Una bienvenida por sesión de ingreso |

## Casos de aceptación escritos

### welcome FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo welcome.

Cuando Elegir destino de entrada y salida por separado y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; procesar ingreso una sola vez.

### welcome RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando El mismo ingreso llega dos veces antes de completar verificación.

Entonces Una sola bienvenida se entrega para esa sesión cuando sea elegible.

### welcome RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Fallo de imagen permite texto legible según política; fallo DM se registra aparte. Reingreso es otra sesión; verificación puede posponer la bienvenida.

### welcome PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. Preview solo gestores; público según canal elegido; DM únicamente al miembro destinatario y cuando esté habilitado.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.

## Incremento local · 18/10/2026

Canal y mensaje pasan por el servicio autorizado del [piloto](../PILOTO_BIENVENIDA.md), commit `3d63780c30da9fab6546d899af21fc2c072d3016`. Datos y aliases existentes, borrador, CAS y último recibo conservados. Las casillas de esta ficha abarcan todo welcome y permanecen abiertas: no se han migrado tarjetas/DM, segundo canal, concesiones de roles, captcha, entrega/deduplicación ni despedidas. La evidencia distingue Mongo/HTTP aislados de Discord/OAuth reales pendientes.

Formulario TECH-04 disponible en `c627d2f3a3ed5a6da76c65e58cb67739a13f7589`: [contrato, UI, revocación y evidencia](../FORMULARIO_BIENVENIDA.md). La ficha global continúa abierta; se comprobaron dos campos existentes con servicios reales aislados y permisos simulados.

Incremento TECH-05 parcial en `0771a47953a17cbac9f4d853554fd0ecb274d45f`: [drenaje de configuración](../CICLO_DE_VIDA_BIENVENIDA.md), incluyendo consultas de canales, permisos y cierre anterior al flush de Mongo. Las siete operaciones incluidas se drenan; entrega, DM/tarjetas y ciclo global permanecen fuera de este incremento. No modifica la política por guild ni despliega código.

Incremento TECH-06 parcial en `ddc4ec433252fefc68ce41e10329a7a64e47a80f`: [entrada pública, imports y cinco rutas HTTP documentadas](../API_BIENVENIDA.md). No cierra los cuatro casos generales de esta ficha ni la configuración avanzada. Evidencia local; producción sin cambios.

## Contrato de producto ampliado · plan 0.4

Objetivo de implementación; no verificación runtime. Estas precisiones amplían la ficha y prevalecen sobre recomendaciones de destino anteriores incompatibles con el plan vigente.

| Dimensión | Definición |
| --- | --- |
| Operaciones | Configurar bienvenida/despedida, guardar borrador, preview, publicar y procesar entrada/salida. |
| Configuración | Canales, DM opcional, mensaje por evento/idioma, tarjeta y rol inicial autorizado; conciliar campos legacy. |
| Datos e invariantes | Configuración versionada y entrega identificada por evento; asignación de rol usa política de roles. |
| UX/UI | Resumen de destinos, editor de texto, selector de plantilla y preview rotulada; confirmar publicado, no solo guardado. |
| Fallo/concurrencia | Canal borrado, DM bloqueado o render caído: registro accionable y alternativa autorizada; nunca doble bienvenida por reintento ciego. |
| Criterio específico | El mismo payload de datos produce preview/evento consistentes; dos gestores generan conflicto; nombres largos y assets ausentes tienen fallback. |

### Conexión con el sistema común

Las entradas presentes en esta ficha deben vincularse al mismo servicio, política y catálogo de errores. Identificar cuáles están efectivamente cargadas; las rutas candidatas anteriores no son un grafo exhaustivo. Aplicar [contratos](../sistema/02_CONTRATOS.md), [configuración](../sistema/04_CONFIGURACION.md) e [idiomas](../sistema/05_I18N.md).

El mensaje público usa el idioma de la guild; las respuestas personales siguen la política privada. No traducir contenido del usuario automáticamente. Versionar configuración y revalidar audiencia/recurso en cada interacción.

### Recursos vinculados

Claves declaradas existentes: `emoji.bienvenida`, `icon.image`, `icon.roles`, `icon.info`, `icon.send`, `icon.edit`, `icon.search`, `icon.error`, `icon.success`, `motion.cargando`, `motion.exito`, `fondos.bienvenida`, `fondos.despedida`, `plantillas.bienvenida`, `plantillas.despedida`, `icon.previous`.

La lista no acredita aprobación, archivo disponible o publicación. Conciliar cada vista/estado con clave, export, binding real y fallback conforme a [recursos](../sistema/06_RECURSOS.md). Emoji ausente nunca elimina la etiqueta de una acción necesaria.

### Cierre de esta ficha

Demostrar el criterio específico anterior con estado feliz y fallo relevante, dos guilds aisladas y ES/EN del alcance. Anotar commit/entorno y separar inspección, simulación y servicio real. Preservar lectura de datos y controles legacy hasta completar consumidores. Apagar el módulo tiene semántica documentada; no borra datos silenciosamente.

## Materiales vigentes integrados · edición 0.6

El catálogo de eventos complementa los registros del sistema; no sustituye los recursos propios de este módulo ni exige decorar todos sus mensajes. Conservar sus claves actuales y usar auxiliares solo donde exista un consumidor real.

La selección vigente está en `assets/obey/catalog-eventos/` desde la raíz del proyecto; consultar [capítulo 15](../sistema/15_CATALOGO_EVENTOS.md). integration-map.json propone claves semánticas, variantes y consumidores; no es un registro runtime instalado. Los labels de revisión se traducen mediante el resolvedor único, y el fallback conserva texto sin markup roto.

Los tres PNG de personaje y seis GIF de expansion-20261020 se mantienen. Los 24 iconos previos de registros de esa expansión se retiraron. Al integrar: permiso/audiencia, export elegido, alias canónico, ID real de Discord si aplica y comprobación en móvil/escritorio. No hay publicación o binding acreditados por esta edición.


## Materiales y consumidores · edición 0.7

Ficha visual: `assets/obey/ui-state-catalog/capability-materials.json`, entrada `welcome`. Familias propuestas de este recorrido: `A10`, `B31`, `B32`, `B64`, `B09`, `B23`, `B24`, `B25`, `B27`, `B28`, `B29`, `B51`, `B52`, `B53`, `B54`, `B57`, `B59`, `B60`, `B61`, `B62`, `B65`, `A11`, `A12`. A01–A12 tienen aprobación visual; B/C requieren revisión. La base previa conserva bindings y datos.

La auditoría por ruta registra 89 apariciones y 22 referencias literales de assets para esta asignación; un cero no demuestra ausencia de función porque existen constructores compartidos y claves calculadas. Consultar el mapa completo y el contrato del módulo.

Aplicar [estados y animaciones](../sistema/16_ESTADOS_Y_ANIMACIONES.md), [mapa de reemplazos](../sistema/17_MAPA_REEMPLAZOS.md) y [recetas](../sistema/19_RECETAS_POR_RECORRIDO.md). El servicio confirma el efecto; el presentador elige PNG/GIF y texto. No modificar contenido del usuario ni símbolos internos de juegos. Esta sección no marca tareas runtime como terminadas.

## Aplicación al servidor de soporte · edición 0.10

El [capítulo 22](../sistema/22_COMUNIDAD_Y_GITHUB.md) y [mapa de canales](../comunidad/MAPA_DE_CANALES.md) proponen destinos del servidor mostrado por el usuario. Conservar este módulo como propietario de sus datos y publicación; validar IDs, permisos y audiencia antes de habilitar. El perfil de soporte no se hereda en guilds cliente. No acreditar funciones por un nombre de canal. GitHub usa inicialmente webhook nativo para avisos técnicos; receptor propio de feeds queda condicional.

## Presentación autorizada 0.11

[Capítulo 23](../sistema/23_MENSAJES_DE_COMUNIDAD.md) conecta las seis familias CM01–CM06 al propietario correspondiente, con [textos completos](../comunidad/MENSAJES_DE_LA_COMUNIDAD.md), localización y condiciones de publicación. Conservar servicios y datos actuales; no confirmar efectos antes de su recibo. El webhook GitHub nativo no consume la plantilla personalizada CM05.

## Capacidades Discord aplicables · edición 0.12

[Capítulo 24](../sistema/24_CAPACIDADES_NATIVAS_DISCORD.md) y [matriz](../discord-nativo/capacidades.json), entrada `welcome`. Capacidades dirigidas a esta ficha: D04. D01/D08/D10/D18 se aplican cuando el módulo esté ofrecido, según entrada, recursos, audiencia e idiomas. Conservar servicio y datos; no activar un dominio diferido por esta referencia. La compatibilidad se revisa contra lockfile y el recorrido real; esta edición no añade implementación.


## Conciliación de investigación 0.14

El alcance de welcome se relaciona con referencias, recorrido, material y aceptación en [plan de ejecución](../investigacion-20261022/08_PLAN_DE_EJECUCION.md) y modulos.json. No se marca implementado ni se cambia su contrato operativo por añadir esta referencia. Las ampliaciones solicitadas se ejecutan por etapas, conservando datos y restricciones vigentes.
