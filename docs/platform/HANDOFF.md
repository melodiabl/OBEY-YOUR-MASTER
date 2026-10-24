# Estado entregado · 17/10/2026

## Orden de ejecución vigente · corrección del usuario

Continuar por el [orden activo del plan](../../tasks/plan.md#orden-activo--23102026): P0 activo, después P1 musical y P2 de gestión; P3 acompaña cada recorrido, luego P4/P5/P6. **La próxima unidad revisa navegación central de setup y opciones Config restantes.** Idioma y prefijo de guild ya comparten servicios y guardado confirmado. El mapa traza once grupos/27 entradas/19 rutas; quedan 648 entradas y 76 rutas por revisar. G01/G02 siguen abiertos. El reproductor completo pertenece a P1. Los «siguientes» fechados debajo son históricos.


## 24/10/2026 · prefijo de guild unificado y desplegado

Código `973ff24`, imagen `78c24d2`, saludable y cero reinicios automáticos en diez muestras. Texto, `/config prefix` y web comparten validación y persistencia versionada. Se rechazan prefijos vacíos/largos, espacios y caracteres invisibles sin truncar; éxito solo tras guardar, conflicto con revisión antigua y acceso Discord revalidado. El formulario propio guarda únicamente el prefijo y conserva idioma/otros ajustes.

Veintitrés casos aislados y 25 originales en la imagen final pasan; formulario EJS completo comprobado en Chromium con teclado, móvil, CSRF y segunda pestaña. 1.029 hashes, HTTP local/público y JS/CSS públicos coinciden. Respaldo CRC y reversión `f92bc40` conservados; verificadores, navegador y servidor sintéticos retirados. [Evidencia y límites](evidence/p0-prefix-20261024.json).

El mapa traza once grupos/27 entradas/19 rutas; prefijo global del owner y reset completo quedan localizados como intenciones distintas, sin ejecutarse ni migrarse. P0 sigue activo: 648 entradas y 76 rutas pendientes de revisión; siguiente unidad, navegación central de setup y opciones Config restantes. G01/G02 y recorrido autenticado real siguen abiertos. Sin push ni CI remoto.

## 24/10/2026 · idioma compartido y nueve grupos revisados en P0

Código `f92bc40`, imagen `27c1b75`, saludable y cero reinicios en diez muestras. Setup, `/config idioma` y web guardan mediante el mismo servicio versionado y esperan persistencia confirmada. Slash revalida permisos y usa el catálogo soportado; el formulario web conserva el valor actual, guarda solo el idioma y rechaza revisiones antiguas. Catorce casos aislados, formulario EJS completo en Chromium y 25 originales en imagen pasan; 1.027 hashes, HTTP local/público y JS/CSS comprobados. Respaldo completo con CRC y reversión `1f4a7ae` conservados. Herramientas, perfil y servidor de prueba retirados, tres archivos originales de tests conservados; sin push.

El [mapa de intenciones](shared-intents.json) revisa nueve grupos, 25 entradas y 19 rutas. Registra diferencias de prefijo (T12), playlists (T19/T20), advertencias con historias separadas (T35) y pagos (T46). El recorrido autenticado real permanece pendiente. **P0 sigue activo: revisar las 650 entradas y 76 rutas restantes, empezando por prefijo.** G01/G02 no se cierran por esta muestra. [Evidencia y límites](evidence/p0-shared-intents-20261024.json).

## 24/10/2026 · conciliación de P0 desplegada, puertas globales pendientes

Código `1f4a7ae`, imagen `becbefb`, saludable y cero reinicios en diez muestras. Inventario efectivo: 675 entradas y 95 rutas con adaptador actual localizado, 779 aliases preservados y 26 políticas de colisión explícitas. Se declaran seis dependencias directas sin cambiar versiones/integridades instaladas; manifests de música/bienvenida/ayuda/Architect conciliados. El CI verifica cobertura, hashes y aliases; contrato aislado de lavalink-client 2.11.0 con ws 8.22.0 comprobado mediante instalación limpia y CommonJS. Shoukaku sigue activo y el cliente nuevo no se instala en producción.

Los 25 tests originales y gates ejecutados localmente sobre la imagen final pasan; 1.026 hashes, HTTP local/público y JS/CSS públicos comprobados. Respaldo completo con CRC y reversión `b31c65b` conservados. Verificadores y dos paquetes temporales retirados, tres archivos originales de tests conservados; sin push ni CI remoto. [Informe y límites](P0-CONCILIACION.md), [evidencia](evidence/p0-reconciliation-20261023.json).

**Siguiente unidad: seguir en P0 revisando intenciones compartidas prefix/slash/web y políticas/servicios/stores.** G01/G02 siguen parciales; localizar adaptadores no acepta el negocio ni todas las operaciones. P1 musical conserva su cola única y matriz pendientes.

## 23/10/2026 · biblioteca y Me gusta en React desplegados

Código `b31c65b`, imagen `271e2ef`, saludable y cero reinicios. Biblioteca con Tus Me gusta, playlists/detalle, recientes personales y top del servidor; colección automática visible junto a playlists desde los mismos corazones de Discord. Un bootstrap autorizado proyecta datos del repositorio existente; detalle comprueba propiedad. Lecturas estrictas del nuevo recorrido distinguen errores/vacíos, manteniendo compatibilidad legacy. Quitar corazón envía false explícito y actualiza el contador; favoritos retirados permanecen consultables y eliminables sin reproducción. Envíos musicales usan API/player existentes, con CSRF, permisos, bloqueo de duplicados y aviso ante resultado incierto. Doce casos temporales, 22 escenarios Chromium sobre Docker, 25 originales locales/en imagen, tipos/fronteras y 120 hashes pasan. Diez muestras saludables y HTTP local/público/JS/CSS comprobados. Respaldo completo con CRC y reversión `d5897e3` conservados. [Alcance y límites](FRONTEND-NEXT.md), [evidencia](evidence/frontend-library-20261023.json).

Siguiente frontend: reproductor completo. La lista carga favoritos/playlists desde el repositorio actual y pagina veinte filas en el cliente; actualizaciones de otros clientes se leen al abrir/actualizar. No añade editor de playlists ni eventos de corazones entre clientes. Sin OAuth autenticado, mensajes/voz de prueba o push. La migración a lavalink-client y demás contratos del maestro siguen abiertos.


## 23/10/2026 · configuración y bienvenida en React desplegadas

Código `d5897e3`, imagen `f87f26c`, saludable y cero reinicios. `/app/` separa resumen, configuración y bienvenida; las entradas compartidas llevan al nuevo recorrido. Canal/mensaje, borrador, vista previa sintética, revisión y publicación reutilizan el servicio, CAS y catálogos es/en. Una petición inicial del editor agrupa configuración/canales/descriptor con permisos frescos. Conflictos conservan edición y exigen actualizar; resultados inciertos bloquean escrituras y una publicación se concilia por operación sin duplicarla. Navegación con confirmación, Escape/foco, bloqueo durante escritura y descarte de datos tras revocación verificados. Diez casos temporales y 22 escenarios Chromium sobre la imagen Docker; 25 originales locales/en imagen, tipos/fronteras y 115 hashes pasan. Diez muestras saludables, HTTP local/público y JS/CSS públicos coinciden. Segundo respaldo completo y CRC verificado; primer intento incompleto identificado y conservado. Reversión `6877829` preparada. [Alcance](FRONTEND-NEXT.md), [evidencia](evidence/frontend-welcome-20261023.json).

Siguiente frontend: biblioteca/Me gusta y reproductor completo. Ajustes generales, tarjetas/DM/despedida y otros contratos del dominio mantienen sus tareas; la migración EJS completa y la musical a lavalink-client siguen pendientes. Sin login OAuth autenticado ni mensajes/eventos/voz de prueba, tests permanentes añadidos o push.


## 23/10/2026 · primera pantalla Next.js desplegada

Código `6877829`, imagen `2f3f933`, saludable y cero reinicios. `/app/` incorpora selector autorizado y música en vivo con controles básicos y cola; enlaces a configuración, bienvenida, registros, biblioteca y reproductor existentes. Next.js + React + TypeScript compila en Docker y Express sirve el export con el login/CSRF/servicios actuales. Las demás pantallas continúan en EJS; landing y fuentes conservadas. Respuestas de otra guild, revisiones antiguas y respuestas tardías tras revocación/desconexión se descartan. Doce casos temporales, 18 escenarios Chromium sobre el artefacto Docker y 25 originales locales/en imagen pasan; tipos/fronteras, 84 hashes de fuente y 24 de export comprobados. Diez muestras saludables, HTTP local/público y hashes públicos JS/CSS correctos. Frontend sin vulnerabilidades conocidas; backend conserva 36 moderate y ninguna high/critical. Respaldo CRC, imagen/argumentos de reversión `7801061` y datos conservados. Sin cuenta OAuth de prueba, mensajes/voz de prueba ni push. [Arquitectura y siguientes pantallas](FRONTEND-NEXT.md), [evidencia](evidence/frontend-next-20261023.json).

Siguiente recorrido web: configuración/bienvenida con el servicio y contrato actuales; después biblioteca/Me gusta y reproductor completo. No cerrar la migración EJS ni P0/P1: Shoukaku sigue activo y lavalink-client/cola única, matriz musical, setups y logs mantienen su alcance pendiente. Aceptación OAuth autenticada y escucha real pendientes del recorrido del usuario.


## 23/10/2026 · registro efectivo y fachada musical desplegados

Código `7801061`, imagen `10db249`, saludable y cero reinicios automáticos. Forward/rewind/seek/reinicio prefix y slash usan la fachada/reloj de sesión: diez segundos por omisión, posición acotada, confirmación del nodo y cancelación ante stop/canción nueva. La actualización del panel no bloquea la acción. Lyrics prefix abandona la ruta HTTP antigua y comparte proveedor, comprobación de grabación y paginación con slash/web. Manifest musical: 73 prefix/29 slash, doce controles intactos. Inventario efectivo offline: 531 prefix, 144 handlers slash en veinte entradas, 779 alias; 28 colisiones/26 alias con ganador conocido, sin errores de carga. Veinticuatro casos temporales y 25 originales, tipos/fronteras y 64 hashes pasan; HTTP local/público 200 y privados sin sesión 401. [Ficha y siguiente unidad](../guia-arquitectura/modulos/music.md), [despliegue](evidence/music-boundary-deployment-20261023.json). Respaldo y reversión ce546e8 conservados, temporales retirados, privado apagado. Sin escucha/voz/mensajes de prueba o push.

Paquete publicado lavalink-client 2.11.0 verificado por integridad y CommonJS aislado, sin instalarlo en el proyecto. AutoSkip:false no evita el avance interno de su cola; el corte exige transferir autoridad y snapshots. Quedan 19 archivos/61 accesos SDK estáticos. P0 conserva otros propietarios pendientes y P1 la migración/matriz completa.

## 23/10/2026 · auditoría y arreglo del catálogo musical desplegados

Código `ce546e8`, imagen `a6fc1d6`, saludable, cero reinicios automáticos. Prefix/slash play/search y web comparten catálogo combinado de cuatro fuentes, hasta cincuenta pistas en páginas de diez. Dos nodos, presupuesto de 6,5 s, caché/coalescencia y ampliación Spotify por identidad/álbum; filtros de artista/versión y agrupación de ediciones. Selector consume una vez, revalida permisos y delega a playCollection. Se corrigió además un fallo visto durante la primera verificación: la búsqueda ya no enfría el pool de audio. 25 casos temporales y 25 originales; tipos/fronteras y 51 hashes pasan. HTTP local/público 200, datos privados sin sesión 401. Candidato: quince pistas ADÉLA/diez Spotify; muestra final HTTP: nueve/cuatro, todas ADÉLA; consulta concreta una y repetida nueve en 7 ms. Los conteos varían por disponibilidad/agrupación, no certifican discografía completa. Trinium 02 predeterminado, Serenetia/MilloHost conectados y privado apagado. Backup y reversión `6d5b666` conservados; verificadores retirados. [Auditoría](../guia-arquitectura/RELEVANCIA_Y_RECOMENDACIONES.md), [despliegue](evidence/music-search-audit-deployment-20261023.json). Recorrido Discord/escucha y migración a lavalink-client siguen abiertos; sin push.

## 23/10/2026 · continuidad musical desplegada, P1 parcial

Código `6d5b666`, imagen `6191934`, bot saludable y cero reinicios automáticos. Se reutiliza la conexión Discord válida para reconstruir/cambiar player remoto; cinco intentos con espera creciente, cancelación por stop y rechazo de eventos retirados. Diez casos temporales y 25 originales pasan; 42 hashes coinciden en imagen/runtime. En doce muestras durante dos minutos: cero salidas de voz, cero errores de recuperación y una sesión restaurada en Serenetia, conectada y con posición confirmada por el nodo. Trinium 02 sigue predeterminado, privado apagado. Backup y reversión c5033b7 conservados; temporales retirados. [Alcance](../guia-arquitectura/CONTINUIDAD_Y_RECUPERACION.md), [evidencia](evidence/music-continuity-deployment-20261023.json). Sin prueba de escucha, push o cierre global de P1.

Lectura del maestro 0.15 y contratos: P0 conserva conciliación de comandos/propietarios pendiente; P1 exige migración real de Shoukaku a lavalink-client y una sola cola por guild. Siguiente: inventariar consumidores y paridad de controles/eventos/REST antes del corte. P2 mantiene configuración/bienvenida/tickets/moderación/logs; recursos e idiomas se integran por recorrido. No instalar un cliente sin conectar sus consumidores ni dar por terminado un dominio por renovar su menú.

## 23/10/2026 · búsquedas y afinidad musical desplegadas

Código c5033b7, imagen c296f83, bot saludable y cero reinicios automáticos; Trinium 02, respaldos públicos y privado apagado. Cuatro fuentes elegidas: Spotify/YouTube/YouTube Music/Apple. Filtro de artista, duplicados/canales y recuperación sin JioSaavn; autoplay/playmusicmix usan mix de grabación confirmada. Panel con recomendaciones privadas por Me gusta de sesión o historial de guild, sin inventar gustos. 20 casos temporales, 25 originales, Chromium aislado, 40 hashes y consultas reales desde contenedor pasan. [Alcance y límites](../guia-arquitectura/RELEVANCIA_Y_RECOMENDACIONES.md), [despliegue](evidence/music-relevance-deployment-20261023.json). Reversión conservada; el primer arranque conservaba un nombre candidato antiguo y se corrigió a obey_bot. No hubo mensajes/voz de prueba, push ni migración a lavalink-client. Las recepciones siguientes conservan su contexto histórico.

Rama: `feature/obey-main-implementation`, repositorio `melodiabl/OBEY-YOUR-MASTER`. El usuario entregó la planificación nueva y reanudó trabajo local el 18/10/2026; el estado del 17/10 que sigue se conserva como registro histórico.

## Estado vigente · fuente 0.15 incorporada el 23/10/2026

ZIP nuevo: 3.908 archivos verificados y archivo eliminado; guía/contratos y 1.034 materiales integrados, seis documentos con avances fusionados. Se excluyeron bootstrap y temporales; no se reemplazó código/lock/CI ni se publicó material. [Conciliación y siguiente unidad](../guia-arquitectura/CONCILIACION_2026-10-23.md). P0 parcial: 675 candidatos AST y compilador slash real offline, 20 entradas/144 operaciones; falta aceptación global de prefix/aliases/propietarios. Destino lavalink-client fijado por la guía, todavía no instalado; P1 requiere una cola y matriz de continuidad/recuperación. Materiales conservan revisión; votos/premium/idiomas/VPS no se habilitan automáticamente. Runtime 07da107, imagen 078d7a2 saludable y sin reiniciar, Trinium 02 y privado apagado. Sin push. Las entregas siguientes conservan su contexto operativo anterior.

## Estado vigente · búsquedas/radio corregidas el 22/10/2026

Desplegado `07da107` (correcciones `9402f80` y parche follow-redirects 1.16.1): !play adela continúa tras la pista única de Spotify; álbumes nativos se cargan completos; elección/regreso de radio/setup evita API 50006. 19 grupos locales, 25 originales locales y en imagen limpia, 31 hashes y tipos/dependencias pasan. Auditoría sin high/critical, 36 moderate heredadas. Consulta real desde el contenedor: 11 pistas, siete álbumes y colección de 11 canciones; una radio entregó PCM no silencioso, sin iniciar voz o mensajes de prueba. Bot/imágenes/Redis saludables, Gateway/heartbeat y salud local/pública 200. Trinium 02 principal y respaldos Serenetia/MilloHost conectados; GDjkhp configurado sin conexión, privado apagado. Backup/reversión conservados, temporales retirados, sin push. [Entrega vigente](DESPLIEGUE-BUSQUEDAS-RADIO-2026-10-22.md). Recorrido/escucha reales, letras NodeLink y resto del plan siguen pendientes.

## Estado vigente · Trinium activado el 22/10/2026

Por instrucción del usuario, `trinium-02` es el principal predeterminado y está conectado. Serenetia/MilloHost conectados como respaldos; GDjkhp configurado sin conexión confirmada. Cambio solo de configuración, mismo código `0be39f3` e imagen `e806ccb`; privado apagado. Ocho escenarios del selector, 25 originales y tres Compose pasan. Gateway/heartbeat, Mongo, 20 slash, 25 hashes y salud local/pública 200; bot/imágenes/Redis saludables, cero reinicios y solo tres servicios always. Snapshots y reversión preservados, sin push. [Entrega vigente](DESPLIEGUE-TRINIUM-2026-10-22.md). Sin reproducción activa observada: escucha/conmutación real, adaptador de letras NodeLink y pendientes globales siguen abiertos.

## Estado vigente · 20/10/2026

Desplegado `0be39f3`: corrección de falsos detalles omitidos en logs de voz por acceso mediante roles. Comparación de audiencias con excepciones personales, conservando privacidad y auditoría staff. 380 grupos/16.800 asignaciones SDK, 25 originales y 25 hashes comprobados. General, indicado por el usuario, tiene audiencia compatible; observar la siguiente salida real. Bot/imágenes/Redis saludables, Gateway/heartbeat y salud local/pública 200. GDjkhp sigue seleccionado, sin conectar y REST 403; Serenetia/MilloHost disponibles como respaldos, privado apagado. Sin audio real de prueba ni cambio de prioridades. Backup/reversión conservados, temporales retirados, sin push. [Entrega vigente](DESPLIEGUE-VISIBILIDAD-LOGS-2026-10-20.md). Historial/retención, entrega durable, caso original de setup y resto del maestro siguen abiertos.

Las entradas siguientes conservan verificaciones históricas.

## Estado vigente · 19/10/2026

Último runtime `64ee040`, imagen `release-logs-quark-20261019-64ee040`: [presentación/contexto y diagnóstico según Quark](DESPLIEGUE-LOGS-QUARK-2026-10-19.md). Se corrigió además la divulgación potencial de motivos en canales abiertos, reproducida solo en una prueba aislada. Permisos staff para detalles, diagnóstico privado, auditoría propia y fallback desconocido. 75 grupos acumulados del incremento y 25 originales; 24 hashes y salud operativa comprobados. GDjkhp, Serenetia y MilloHost disponibles, privado apagado. No se provocaron eventos ni mensajes de prueba reales. Sin push. Siguiente: historial/retención, explorador autorizado y entrega durable; no cerrar el contrato completo de logs ni el caso original de setup. El párrafo siguiente conserva la entrega técnica anterior.

Código desplegado `621366a`, imagen `release-logs-owner-20261019-621366a`: avisos privados al dueño por altas/bajas reales, sin borrar configuración al salir, y consumidor de registros con privacidad y configuración común Discord/web. 111 grupos temporales y 25 originales pasan; hashes, Gateway/heartbeat, Mongo y salud HTTPS comprobados. Temporales retirados, respaldo/reversión preservados, sin push. [Entrega y límites actuales](DESPLIEGUE-REGISTROS-OWNER-2026-10-19.md).

Siguiente trabajo: historial/retención y entrega durable de T38; después seguir consumidores y dependencias abiertas del plan completo. No cerrar T38/MOD-LOGS, arquitectura global, Epic ni el caso original de acceso/guardado. Los menús remodelados no validan todos sus sistemas. GDjkhp y MilloHost disponibles, Serenetia configurado pero sin conectar en la verificación; privado apagado. Los estados siguientes son antecedentes.

## Estado vigente · despliegue del 18/10/2026

Revisión posterior de facilidad de uso desplegada en `3673b478678d368ee5637e6562c3b6754b402574`, imagen `release-setup-ux-20261018-3673b47`: entrada `!setup`, navegación por el mismo mensaje, regreso protegido y rutas básicas de bienvenida/tickets/música. 58 grupos de SDK/Mongo aislado, 100 ciclos y 25 tests originales; temporales eliminados. Producción saludable, Gateway/heartbeat y HTTPS comprobados. [Despliegue vigente y reversión](DESPLIEGUE-SETUP-UX-2026-10-18.md). Sigue pendiente la validación de uso con el usuario en Discord y el plan global.

Despliegue anterior, conservado como historial:

Los 63 comandos de setups están remodelados y desplegados en `f4acfac5226022d68e458ef09cc24e216df69292`, imagen `release-setups-20261018-f4acfac`. Bot, imágenes y Redis están saludables y con arranque automático configurado; Gateway/heartbeat, MongoDB y salud HTTPS pública comprobados. GDjkhp, Serenetia y MilloHost conectaron; el Lavalink privado permanece apagado. Backup e imagen anterior conservados. [Evidencia y reversión](DESPLIEGUE-SETUPS-2026-10-18.md).

Los 25 tests originales, tipos y reglas de dependencias pasaron; no se añadieron verificadores permanentes. Pendientes: recorrido interactivo de Discord/audio, proveedor Epic y el plan global restante. No se hizo push. Los incrementos que siguen son registros históricos anteriores a este despliegue.

## Reanudación · 18/10/2026

Última entrega local `f4163778677b3b893bde2308c1a328e8d24111e5`: [setup-language remodelado](../guia-arquitectura/IDIOMA_SETUP.md), con guardado confirmado, CAS y menú de un mensaje. 21 escenarios Mongo/SDK, 100 ciclos y 25 originales pasan; fixtures y script temporal retirados. Dos entradas de 63 remodeladas, 61 pendientes; siguiente setup-embed. Sin publicación o despliegue.

[HeavenCloud](HEAVENCLOUD-2026-10-18.md) no respondió en TCP, HTTP, búsqueda ni handshake WebSocket desde este host. No se cambió la configuración musical.

Prioridad del usuario: remodelar código y menús de Discord de todos los setups. [Mapa e inventario](../guia-arquitectura/REMODELACION_SETUPS.md), 63 comandos. Navegación inicial implementada localmente en `eadc547b0684ded2c9cca65cc685362c518ab660`: un mensaje con categorías/páginas, registro vivo, autorización fresca, cooldown y collector acotado. 15 escenarios SDK y 100 ciclos de limpieza pasan; los 25 originales siguen pasando. No ejecuta ni migra las reglas internas de los asistentes restantes. Siguiente: setup-language. Temporales retirados, sin publicación/despliegue.

Incremento anterior TECH-06 parcial en `ddc4ec433252fefc68ce41e10329a7a64e47a80f`: [API pública, reglas y evidencia](../guia-arquitectura/API_BIENVENIDA.md). Cinco rutas existentes documentadas y coincidentes con Express/manifest; imports y tipos incorporados a CI. Diez mutaciones y 20 respuestas HTTP locales comprobadas. No hay nuevos tests/helpers permanentes, publicación remota ni despliegue. TECH-05 y ARCH-04 globales siguen pendientes.

Incremento previo TECH-05 parcial en `0771a47953a17cbac9f4d853554fd0ecb274d45f`: [cierre de configuración y evidencia](../guia-arquitectura/CICLO_DE_VIDA_BIENVENIDA.md). Espera las operaciones aceptadas y conserva errores/permisos antes del flush de Mongo. Plazo global de 20 segundos vigente; cierre global y producción pendientes. Comprobaciones temporales sin restaurar scripts/tests; Mongo aislado eliminado y servidores de prueba cerrados.

Incremento previo TECH-04 en `c627d2f3a3ed5a6da76c65e58cb67739a13f7589`: [formulario y evidencia](../guia-arquitectura/FORMULARIO_BIENVENIDA.md). Verificado localmente; temporales retirados, sin publicación/despliegue.

Guía nueva conciliada sin sobrescribir el checkout; [piloto de configuración de bienvenida](../guia-arquitectura/PILOTO_BIENVENIDA.md) en `3d63780c30da9fab6546d899af21fc2c072d3016`. [Plan y estados actuales](../guia-arquitectura/PLAN_POR_ETAPAS.md). Cambios locales no desplegados ni publicados; las verificaciones y límites se registran por capacidad. La limpieza de tests/scripts se mantiene. El runtime de producción descrito abajo corresponde a la última verificación del 17/10, no a una nueva comprobación en vivo de esta reanudación.

## Limpieza pedida

- Eliminados 122 archivos de pruebas y ayudantes añadidos por el asistente.
- Eliminados 28 scripts auxiliares: `verify-*`, fixtures, auditorías, benchmark, preview y validación de comandos.
- Conservados los tres archivos de tests originales del proyecto. `npm test`: 25 casos pasan.
- Conservados los scripts operativos de assets/materiales, Redis, backups y generación de fondos.
- CI actualizado: instalación, tests originales, comprobación de assets y build. Eliminadas las invocaciones y servicios de integración ligados a verificadores retirados.
- Los cambios pendientes de interfaz y evidencias se guardaron sin modificar en `c5979b3`. Los dos verificadores previamente modificados se eliminaron como parte de la limpieza autorizada.
- Los scripts temporales de diagnóstico de esta intervención se retiran del workspace tras guardar este estado.

El historial conserva las pruebas y scripts retirados. Las cifras antiguas de tests de otros informes son resultados históricos, no la suite actual.

## Aplicación en funcionamiento

Código musical `cd336f8bec50091fb861661e0ef358134f46c5e0`; imagen `234ca907361e49e870ff0f7efb8b1c76e3119daab76d1803bf592866a7f24c8b`, etiqueta `release-panel-backoff-20261017`. Recuperación local en `.runtime/bot-recovery-public-only.yml`. Los archivos privados de ejecución y credenciales están excluidos de Git.

Bot healthy, cero reinicios automáticos, Mongo y música listos, sesión recuperada. GDjkhp seleccionado; Serenetia/MilloHost de respaldo. Nodo privado apagado/excluido, sin WARP ni puerto 2333. Images/Redis conservan imagen y fecha de inicio. La limpieza del repositorio no implica un despliegue nuevo de la interfaz.

Se guardaron en la rama los cambios previos de Architect/bienvenida y sus capturas. Esa integración de interfaz no se desplegó como parte del trabajo musical; se comprobó sintaxis JS y compilación de EJS al guardar el estado.

## Pendiente conocido

El reloj utiliza la posición confirmada en la misma respuesta PATCH del nodo; se corrigieron pausa/reanudación, seek, filtros, inicio tardío y posición inicial del mensaje. El panel reutiliza un mensaje y agrupa publicaciones. Los botones solicitan refresco confirmado inmediatamente; el progreso periódico cede ante límites de Discord.

Discord devuelve HTTP 429 en ediciones de mensajes, con esperas de reintento observadas de 1–2 s. Antes de la pausa adaptativa hubo operaciones de 8–12 s. La última muestra posterior todavía incluyó tres ediciones de 3,4–6,6 s en 149 s; no se declara resuelto el retraso de todos los botones. La lectura del panel coincidió en título y URI con la sesión. No se implementó la propuesta posterior de editar mediante respuestas de interacción.

Antes de retirar los tests añadidos pasaron 575 casos y 95 comprobaciones de imagen; la evidencia conserva ese contexto. [Detalle](PLAYER-STATE-SYNC.md) y [evidencia redactada](evidence/player-state-sync-runtime.json).

La referencia del ZIP actualizado, su extracción y la precedencia del material siguen registradas en [source.json](source.json). Los límites conocidos de fuentes/plugins públicos permanecen en [el informe de nodos](PUBLIC-NODE-RESEARCH.md).


## Reanudación · 19/10/2026

El usuario precisó que el centralizador de setups y el reproductor son tareas independientes. `/setup` global privado y simplificado quedó en `4a0f080`; selección musical y recuperación de grabaciones en `398e22f`. Ambas revisiones se desplegaron en una sola sustitución del proceso, con código `398e22f31b49139c5ae54d4ea4ec5de2398e7bd5`, imagen `0ec4dc1cd5dea434f75584c75ea0b72408b34a2a73751ba2272473641d2dced2`. [Estado, evidencia y reversión](DESPLIEGUE-SLASH-MUSICA-2026-10-19.md).

Pasan 19 grupos de navegación slash, 48 musicales, los 25 tests originales, tipos y reglas de dependencias. Verificadores y contexto temporal retirados. Runtime sano: 20 slash globales confirmados por REST, Gateway/heartbeat, MongoDB, tres nodos públicos y HTTP/HTTPS 200; privado apagado, sin push. La selección favorece grabaciones originales sin garantizar la propiedad ni detectar Shorts sin metadatos. No se probó audio real ni el recorrido manual con el usuario. Continuar pendientes globales del ZIP y Epic sin presentar estos cambios como cierre de toda la arquitectura.


## Incidencia de setups · 19/10/2026

El usuario copió avisos genéricos de acceso/guardado de `!setup` y de idioma. La ubicación real (servidor/canal) sigue pendiente; no se confirmó la causa de ese error original. Se reprodujo y corrigió una ausencia distinta y concreta: idioma pedía descartar un borrador sin ofrecer ese botón. `ff94f31d91f187310e1776cd794556772fdcbc10` añade descarte sin escrituras y avisos clasificados/registros seguros en el recorrido común. 23 grupos con objetos/collectors reales, 25 originales, tipos y reglas de dependencias pasan; verificador retirado.

Desplegado en imagen `813394a62fe3d2ada32d54a4e97813cb35eb8436d7e8f2a2dc03ff42f73790b2`, con 10 hashes, Gateway/heartbeat, 20 slash, Mongo y tres nodos públicos, servicios healthy y HTTP/HTTPS 200. Privado apagado y sin push. [Evidencia y reversión](DESPLIEGUE-ERRORES-SETUP-2026-10-19.md). No decir que el error original del usuario está resuelto: falta observarlo/ubicarlo; los nuevos registros todavía no muestran un fallo del setup.
