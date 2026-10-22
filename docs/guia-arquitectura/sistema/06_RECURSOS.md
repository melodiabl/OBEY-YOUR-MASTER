# Recursos, emojis, GIF y tarjetas

## Fuentes existentes

Reutilizar `assets/obey/registry.json`, `production/catalog.json`, `presentation.json`, mapas de emojis y `handlers/assets/`. El registro actual contiene exports con `applicationEmojiId: null`: esos elementos existen como archivos, pero no son emojis ya publicados. No fabricar IDs ni reutilizar IDs borrados como si fueran válidos.

El apéndice [13_ASSETS_POR_MODULO](13_ASSETS_POR_MODULO.md) conserva las claves declaradas para cada ficha. Una clave declarada significa intención de uso; el consumidor y el estado del binario se verifican antes de marcarla lista. El material gráfico del proyecto permanece en sus rutas existentes dentro del ZIP.

## Registro canónico objetivo

| Campo | Propósito |
| --- | --- |
| key y aliases | Referencia semántica estable para consumidores nuevos y legacy |
| family, module, meaning | Qué comunica y en qué contexto se usa |
| source y hash | Archivo fuente y correspondencia con export |
| variants | Estático, animado, tamaño y formato reales |
| status | Revisión pendiente, aprobado, exportado, publicado, retirado o roto |
| bindings | Application ID, emoji ID, nombre, animated y fecha de verificación reales |
| fallback | Omitir imagen o usar etiqueta legible según superficie |
| license | Origen y permiso de uso |

Los nombres de campos son contrato objetivo: adaptar el esquema actual, sin crear otro catálogo paralelo. Un emoji no se marca aprobado porque ya fue generado. Los identificadores de plataformas deben ser reconocibles y respetar sus guías de marca; no reemplazarlos por el personaje o un símbolo inventado que confunda el origen musical.

## Uso por tipo de recurso

| Tipo | Uso | Degradación |
| --- | --- | --- |
| Emoji estático | Texto y controles con clave semántica | Etiqueta completa, sin markup roto |
| Emoji animado | Actividad breve o reacción decorativa | Variante estática; no comunica éxito por sí solo |
| Icono PNG/SVG | Tarjetas y recursos renderizados | Texto o icono conocido, según renderer |
| GIF/imagen animada | Escena de espera o celebración publicada | Imagen estática; no retrasar una operación por reproducirla |
| Fondo de tarjeta | Bienvenida, despedida, perfil y nivel | Fondo local seguro |
| Fuente | Texto dinámico de tarjetas | Fallback instalado con cobertura del idioma |

## Pulsación y animación

Un botón nativo no ejecuta una timeline CSS. Flujo objetivo: interacción aceptada → mostrar estado procesando cuando proceda → ejecutar → presentar resultado confirmado. Se puede reemplazar un emoji o medio por su variante animada, pero ese cambio requiere una actualización del mensaje; el inicio exacto del GIF en el cliente no queda sincronizado por la pulsación.

No añadir una edición adicional y otra espera decorativa delante de cada acción musical. Para Like, confirmar favorito guardado con estado del botón/texto privado; animación opcional que no sostiene la verdad del estado. Para errores, etiqueta y siguiente paso aunque la animación no cargue. Respetar movimiento reducido del usuario cuando la superficie lo permita y conservar alternativa estática.

## Barra musical

La barra se calcula desde posición confirmada, reloj y estado. La opción inicial conserva Soundy y el progreso existente hasta validar un reemplazo. Referencias investigadas: JMusicBot muestra un marcador compacto; FlaviBot publica tarjeta gráfica. Son referencias de composición, no diseños aprobados de OBEY ni garantías de cadencia.

Un GIF predeterminado no se usa como tiempo transcurrido: pausa, seek, buffering y reapertura del mensaje lo desincronizan. Una tarjeta con barra se regenera al publicar estado; medir ese coste antes de elegirla para cada refresco. No prometer arrastrar una barra dibujada como imagen.

## Publicación en Discord

Preferir emojis propiedad de la aplicación para los recursos globales de OBEY, verificando límites vigentes y uso por superficie en la [API oficial de emojis](https://docs.discord.com/developers/resources/emoji). No subir fondos, escenas y fuentes como emojis si sus consumidores no lo necesitan.

Inventariar todos los hardcoded: markup `<:...:id>`, `<a:...:id>`, emoji de botones/selects, Unicode decorativo, URLs CDN, JSON y traducciones. Separar IDs de emoji de IDs de mensajes/canales. Relacionar ocurrencia → significado → clave → archivo → binding real → fallback. No reemplazar indiscriminadamente emojis escritos por usuarios.

Subida: selección aprobada → validar formato/peso según límites actuales → listar recursos remotos → conciliar nombre/hash/binding → crear faltantes autorizados → guardar respuesta real → comprobar uso → retirar referencias obsoletas. Repetir la operación no debe crear duplicados. Mantener credenciales fuera de documentos y ZIP.

La cantidad exacta a subir se calcula después de conciliar variantes y emojis ya publicados; ni el número de claves ni el de PNG equivale al número de uploads.

## Tarjetas dinámicas

Bienvenida/despedida y ranking/perfil: fondo sin texto fijo, avatar, nombre, datos variables, área segura, fuentes y layout versionado. Usar el renderer que el proyecto ya tenga —Canvacord y canvas se concilian por tarjeta— detrás de un contrato `render(type, data, locale, theme, templateVersion)`. Preview y evento consumen el mismo contrato.

Resolver URLs remotas con límites de tamaño/tiempo, formatos permitidos y protección de red; no descargar direcciones internas arbitrarias desde una plantilla. Caché por contenido, versión, locale y tema. Cola acotada, worker aislado y fallback textual si falla. Nombres largos, acentos y alfabetos adicionales deben tener política de corte y cobertura de glifos.

## Catálogo integrado de eventos · edición 0.6

Consultar [capítulo 15](15_CATALOGO_EVENTOS.md) y la ruta única assets/obey/catalog-eventos/. Contiene 117 entradas de diseño (113 eventos y cuatro auxiliares), dos variantes y mapa de claves/consumidores. Las escenas y seis GIF están en expansion-20261020; la muestra anterior de 24 iconos de registros se retiró. Los registros y bindings actuales permanecen como autoridad hasta integrar los nuevos recursos. No confundir eventos documentados, emojis publicados y funciones implementadas.


## Conciliación de materiales 0.7

La ampliación vigente está en [16 · Estados](16_ESTADOS_Y_ANIMACIONES.md), [17 · Mapa de reemplazos](17_MAPA_REEMPLAZOS.md), [18 · ES/EN y publicación](18_I18N_Y_PUBLICACION.md) y [19 · Recetas](19_RECETAS_POR_RECORRIDO.md). Abrir también el índice único MATERIALES.md de la raíz. A01–A12 están aprobados visualmente; B/C son propuestas nuevas. Los deltas y los mapas no se cargan automáticamente por el runtime. Antes de editar un consumidor, comprobar su hash y audiencia. Conservar el registro único, la lógica de juegos, datos del usuario y las tareas de implementación pendientes.
