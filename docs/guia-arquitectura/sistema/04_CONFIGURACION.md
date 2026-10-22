# Configuración editable por servidor

## Modelo objetivo

Cada módulo publica schema de configuración, defaults seguros, versión y campos permitidos. Diferenciar configuración de código, secretos de operación y preferencias de usuario. Una instancia de configuración pertenece a `guildId + moduleId`; las opciones personales usan `userId` y el alcance que corresponda.

La implementación actual del servicio común confirma borrador/publicación para bienvenida con `channelId` y `message`. Extender ese camino de forma incremental. No presentar una tarjeta habilitar/deshabilitar para un módulo cuyo ciclo de vida no sabe qué hacer con sus sesiones existentes.

Datos de diseño: `schemaVersion`, `revision`, `enabled`, `values`, `updatedAt`, `updatedBy`. El borrador añade su propia revisión, la revisión pública de base, propietario/colaboración y fecha. No reemplazar el hash de revisión actual de bienvenida sin mapping y compatibilidad explícitos.

## Campos compartidos

| Grupo | Campos objetivo | Validación |
| --- | --- | --- |
| Idioma | Público y overrides autorizados | Catálogo publicado y mapeo Discord |
| Destinos | Canales, categorías y roles | Existencia, tipo, guild y permisos efectivos |
| Acceso | Roles de gestión, DJ, soporte y excepciones | Deny/allow definidos; jerarquía Discord siempre vigente |
| Mensajes | Plantilla permitida por evento/idioma | Variables, longitud, menciones y audiencia |
| Visuales | Acento permitido, tema y plantilla de tarjeta | Registro vigente, contraste y fallback |
| Límites | Cooldown, sesiones, tiempo de espera | Rango, presupuesto y operación dependiente |

Los campos concretos y la semántica de apagado se detallan en cada ficha. La interfaz consume el mismo contrato de validación del servidor. Una edición de texto o canal no debe requerir desplegar código.

## Publicación

Leer versión → editar borrador → validar → previsualizar → comparar con publicado → publicar con revisión esperada → recibo de cambio. Dos administradores no se pisan: el segundo ve conflicto, diff y opción de rehacer su edición sobre la versión actual. Reintentar la misma publicación con su ID devuelve el recibo de esa operación; no duplica mensajes ni aplica valores nuevos bajo el ID viejo.

Guardar no activa. Probar manda un ejemplo identificado a un destino elegido y autorizado, no inventa un evento real. Restaurar default muestra qué herencia recupera. Descartar afecta al borrador elegido y no al estado público.

## Permisos y recursos eliminados

Revalidar permisos antes de guardar/publicar y al usar el destino. Si un canal desaparece, mostrar configuración incompleta; no adivinar otro por su nombre. Si falta un rol, no sustituirlo por @everyone. Los paneles antiguos no conservan privilegios revocados.

## Importación e integración con otros bots

Permitir vincular canales/roles existentes creados por Server Market u otra herramienta. Mostrar nombre + ID + comprobaciones. Sin permiso o fuente API oficial no prometer lectura automática de configuraciones privadas de otros bots.

Importar configuración muestra esquema, alcance, campos soportados y mapeo de referencias. Resolver IDs de otra guild mediante selección explícita. No importar tokens, credenciales o bindings de emojis ajenos como si fueran válidos. Exportar configuración no incluye transcripciones, historial personal o datos de producción.

## Desactivación

Política por capacidad: detener nuevos eventos, conservar historial y dejar terminar sesiones existentes cuando corresponda. Música pregunta alcance al detener una sesión; tickets puede cerrar nuevas aperturas y mantener atención de abiertos; automatización cancela programaciones futuras autorizadas. Apagar nunca significa borrar datos silenciosamente.

## Catálogo integrado de eventos · edición 0.6

Consultar [capítulo 15](15_CATALOGO_EVENTOS.md) y la ruta única assets/obey/catalog-eventos/. Contiene 117 entradas de diseño (113 eventos y cuatro auxiliares), dos variantes y mapa de claves/consumidores. Las escenas y seis GIF están en expansion-20261020; la muestra anterior de 24 iconos de registros se retiró. Los registros y bindings actuales permanecen como autoridad hasta integrar los nuevos recursos. No confundir eventos documentados, emojis publicados y funciones implementadas.
