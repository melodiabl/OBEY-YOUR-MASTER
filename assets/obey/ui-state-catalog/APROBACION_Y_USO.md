# OBEY · Selección visual aprobada

El usuario aprobó los doce diseños A01–A12 y sus animaciones con «Me gustaron todos».
Fecha: 20/10/2026, America/Asuncion.

El alcance de esta aprobación son los doce diseños presentados, no las 316 entradas históricas de la base local ni funciones todavía no implementadas.

## Registro de recursos

Cada carpeta approved/<familia>/ contiene idle-128.png, idle-256.png, motion.gif, result-128.png, result-256.png, idle.svg y result.svg. propuestas.json conserva rutas y hashes. Los nombres de familia son rutas de material; no se deben introducir como un segundo registro runtime sin conciliarlos con el registro actual.

| ID | Familia/carpeta | Consumidor previsto | Uso correcto del movimiento |
| --- | --- | --- | --- |
| A01 | ticket | Abrir ticket desde panel o comando | Pending mientras se confirma la apertura |
| A02 | favorito | Favorito musical; perfil autorizado | Pending al persistir la preferencia del actor |
| A03 | reproduccion | Estado musical / mp_toggle | Reproducción activa confirmada; no usar como carga |
| A04 | mezcla | mp_shuffle y comando equivalente | Pending del cambio de modo |
| A05 | repetir | mp_loop y comando equivalente | Pending; acompañar pista/cola/off con texto |
| A06 | autoplay | mp_autoplay y configuración equivalente | Pending del cambio; no implica track ya elegido |
| A07 | escudo | Revisión de seguridad | Pending de una revisión concreta, con alcance explícito |
| A08 | avisos | Operaciones de notificación | Pending del envío o procesamiento |
| A09 | exportar | Transcripción y exportación autorizadas | Pending de la preparación del archivo |
| A10 | tarjeta | Preview/render de bienvenida y tarjetas | Pending del render; el resultado muestra el recurso real |
| A11 | confirmacion | Confirmaciones compartidas | Después de confirmar; nunca sustituye el indicador de carga |
| A12 | sincronizar | Actualización de configuración/datos | Pending de una actualización autorizada |

## Estados y superficies

- En mensajes: usar el icono que describe el hecho o resultado. Un registro histórico no debe seguir mostrando «procesando».
- En botones: usar el PNG estático publicado como emoji en reposo; cambiar al emoji animado durante la actividad indicada y al resultado cuando corresponda.
- En menús: usar iconos pequeños para distinguir opciones. El resultado se confirma en la respuesta posterior.
- En medios grandes: usar imágenes/tarjetas como medios; no confundir una miniatura con un emoji de botón.
- En operaciones rápidas: omitir el estado animado si ya hay resultado. No introducir demoras artificiales.
- En favoritos: preservar privacidad; un panel público no muestra el favorito de todos como si fuera uno solo.
- En fallo o resultado desconocido: usar el estado canónico correspondiente y su explicación. No enseñar el PNG de éxito por haber terminado una animación.

El movimiento no representa un reloj exacto ni un control de fotogramas. No prometer reinicio sincronizado del GIF al pulsar en todos los clientes de Discord.

## Integración pendiente

1. Inventariar los consumidores reales y conciliar las claves con el resolvedor de assets actual.
2. Publicar los recursos seleccionados y registrar IDs reales, sin duplicar los ya publicados.
3. Conectar los cambios de estado a resultados de servicios, sin repetir efectos si falla una edición del mensaje.
4. Verificar permisos, privacidad, doble clic, reinicio, recursos inaccesibles y traducciones.
5. Incorporar materiales y documentación al ZIP de implementación en esta entrega, conservando Soundy y los doce controles.

Estado actual: aprobado visualmente y exportado. Sin publicación en Discord, sin binding runtime e incluido como material en el ZIP principal, sin conexión runtime. La aprobación visual no certifica pruebas operativas.
