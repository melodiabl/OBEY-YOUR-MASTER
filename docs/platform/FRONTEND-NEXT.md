# Migración del panel a Next.js

Decisión expresa del usuario, 23/10/2026: Next.js con React y TypeScript. La migración se realiza por pantalla y conserva la identidad y las fuentes de OBEY. No cambia la autoridad de la cola musical ni sustituye los servicios del bot.

## Primera pantalla

`/app/` incorpora selector de servidores administrables con OBEY, estado musical en vivo, cola de las cinco siguientes canciones, pausa/reanudación, anterior, siguiente, detener y volumen. Configuración y bienvenida incorporan el recorrido descrito abajo. La biblioteca incorpora el recorrido descrito abajo. Registros, ayuda y reproductor completo enlazan sus recorridos existentes y siguen usando EJS. La landing continúa en `/`.

El paquete aislado `dashboard/frontend` fija Next 16.4.3, React/React DOM 19.3.1, TypeScript 5.9.3 y Socket.IO Client 4.8.3 en su propio lock. No instala React ni Next entre las dependencias del proceso del bot. Node mínimo del paquete: 22.12.0.

Next genera una exportación estática bajo `/app`. Express entrega el HTML después de comprobar la sesión y solo expone los archivos compilados de `_next`; no sirve el directorio fuente. El Dockerfile compila el frontend en una etapa y copia únicamente `out` a la imagen final. CI usa ese mismo build. El runtime sigue siendo un único proceso del bot/Express, sin servidor Next adicional.

Esta elección permite migrar componentes y rutas de manera gradual sin duplicar OAuth, sesiones o servicios. No usa Server Actions, SSR por solicitud ni rutas API de Next. Si una pantalla requiere esas funciones, habrá que revisar el despliegue antes de incorporarlas. [Exportación estática de Next](https://nextjs.org/docs/app/guides/static-exports), [raíz de Turbopack](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack#root-directory).

## Autenticación y estado

- `/api/panel/context` exige sesión, vuelve a consultar los permisos de Discord y comprueba que la sesión siga vigente. Devuelve solo identidad pública, servidores administrables presentes en el bot y el valor CSRF de la sesión; nunca tokens OAuth, configuración de nodos ni credenciales.
- Si Discord falla no se reutiliza la lista antigua como autorización. OAuth acepta únicamente el retorno fijo `/app`, conservando la regeneración de sesión existente. Las respuestas privadas no se almacenan en caché compartida.
- Lectura y controles musicales reutilizan las API y Socket.IO existentes. Los POST mantienen CSRF y la comprobación fresca de permisos del backend. No hay segundo player ni cola local.
- Cambiar de servidor aborta la lectura y elimina la suscripción anterior. Revisiones antiguas se ignoran; una revocación borra los datos y bloquea respuestas tardías hasta verificar de nuevo. Las acciones no se reintentan automáticamente, y los controles se bloquean durante su confirmación o desconexión.
- El avance de tiempo parte de la posición y velocidad del snapshot del servicio, con interpolación local entre actualizaciones. No modifica el reloj musical canónico ni promete corregir la latencia del proveedor.

## Configuración y bienvenida

La navegación de `/app/` ofrece Resumen, Configuración y Bienvenida. Las vistas se conservan en `?server=ID&view=configuration` y `?server=ID&view=welcome`. La configuración central da acceso a bienvenida, registros y ajustes generales; estos dos últimos conservan sus pantallas existentes. El editor de bienvenida anterior y sus API siguen disponibles por compatibilidad; la navegación compartida dirige a React.

Bienvenida reutiliza `createWelcomeService`, el contrato, el descriptor de campos y los catálogos es/en existentes. No introduce otro repositorio ni otro escritor. Un GET autorizado `/api/guilds/:guildId/modules/welcome/editor` agrupa configuración, canales disponibles y descriptor; así la apertura realiza una comprobación fresca de permisos OAuth en lugar de repetirla en tres peticiones. Las políticas del servicio siguen verificando acceso y canales. Las API de borrador, vista previa y publicación conservan sus rutas y CAS.

El gestor edita canal/mensaje, guarda el borrador y publica después de comparar con lo activo. La vista previa usa datos de ejemplo y no envía mensajes. El límite procede del descriptor generado desde Zod. Publicar revalida el canal y utiliza el identificador de operación del backend. Ante un resultado desconocido se bloquean las escrituras hasta una lectura explícita; se concilia una publicación confirmada por su identificador sin reenviarla automáticamente. Un conflicto conserva la edición y obliga a actualizar/comparar. Un borrador basado en una publicación antigua puede volver a guardarse explícitamente contra la revisión actual.

Cambiar de sección o servidor con edición sin guardar abre una confirmación que distingue edición local, borrador guardado y publicación. Escape conserva la edición y restaura el foco. Durante una escritura se bloquea la navegación interna; lecturas y vistas previas se cancelan al salir. Revocar acceso borra el contenido de bienvenida. Un error CSRF conserva la edición y requiere reabrir la sesión; actualizar solo la configuración no vuelve a habilitar escrituras con un token antiguo.

La verificación usa el servicio real con repositorios/políticas de prueba en un servidor aislado; no modifica Mongo ni servidores de usuarios. Evidencia: `evidence/frontend-welcome-20261023.json`. Esta unidad migra canal/mensaje/borrador/revisión de bienvenida, no tarjetas, DM, despedida ni los demás ajustes generales.

## Biblioteca y Tus Me gusta

`/app/?server=ID&view=library` reúne Tus Me gusta, playlists, recientes personales y top del servidor. Tus Me gusta figura también como playlist automática y privada, calculada desde los mismos corazones de Discord, sin copiar las canciones a una segunda colección. Las entradas compartidas y el resumen enlazan el nuevo recorrido. El listado admite filtro por título/artista y páginas de veinte filas; en móvil todas las secciones permanecen visibles.

Un GET `/api/music/library/:guildId` agrupa las lecturas del repositorio musical existente con una comprobación fresca de permisos. El usuario se deriva de la sesión; el servidor, de su acceso autorizado. Solo se proyectan campos de visualización y claves necesarias para los corazones. El detalle `/api/music/library/:guildId/playlists/:playlistId` valida el ID y la propiedad antes de devolver canciones. Las lecturas del nuevo recorrido activan errores estrictos en el mismo repositorio; las lecturas anteriores conservan su comportamiento. Los datos de otras cuentas/servidores y respuestas tardías se rechazan en el cliente.

Quitar un corazón envía `liked:false`, y su confirmación actualiza el listado y el contador de la colección automática. Los favoritos históricos de proveedores retirados siguen visibles y se pueden quitar, con reproducción deshabilitada. El envío individual y de Tus Me gusta reutiliza las API musicales y el player existentes, sin otro gestor de cola. El backend comprueba sesión, CSRF y permisos de reproducción. Se bloquean activaciones simultáneas; errores y resultados inciertos no disparan reintentos automáticos. Antes de repetir un envío no confirmado, se indica revisar la cola. Si no hay canal de voz, se pide elegirlo desde el reproductor.

El listado toma la fotografía actual al abrir o actualizar, y confirma inmediatamente las retiradas hechas en esta pantalla; no incorpora un canal de eventos de corazones entre clientes. La paginación es de presentación: el repositorio existente carga los favoritos y playlists completos; recientes se limita a cien entradas y top a diez canciones/cinco oyentes. El detalle de playlists es de consulta/reproducción, no un nuevo editor de creación o borrado. El reproductor EJS y los comandos existentes siguen disponibles.

La verificación usa el servicio real de corazones con almacenamiento de prueba aislado y contratos HTTP reales; no escribe datos ni inicia audio en servidores de usuarios. Evidencia: `evidence/frontend-library-20261023.json`. La migración completa del reproductor y del cliente musical sigue pendiente.

## Desarrollo y compilación

Desde la raíz:

```sh
npm ci --prefix dashboard/frontend --ignore-scripts
npm run web:typecheck
npm run web:build
```

El arranque normal del bot sirve el resultado en `/app/`. `npm run web:dev` abre Next en `127.0.0.1:3204`, con proxy al backend `127.0.0.1:3002`; `OBEY_DASHBOARD_ORIGIN` permite cambiar ese destino solo para desarrollo. Para probar OAuth local, el backend y Discord deben tener configurado el callback de ese entorno. No copiar credenciales de producción al frontend ni usar variables `NEXT_PUBLIC_*` para secretos.

## Verificación y siguientes pantallas

La aceptación de esta unidad comprende compilación limpia local y Docker, tipos, pruebas originales, autorización HTTP/CSRF, descarte de revisiones antiguas, navegador con desconexión/revocación/cambio de servidor y disposición a 1440/768/320 px. Las comprobaciones usan un servidor local aislado y no una cuenta Discord real; la aceptación OAuth autenticada y la escucha real siguen pendientes del recorrido del usuario.

El siguiente recorrido web pendiente es el reproductor completo, dentro de P1 y después de la conciliación de P0 y de disponer del contrato musical canónico. El [orden activo del plan](../../tasks/plan.md#orden-activo--23102026) gobierna su ejecución; este documento no fija una prioridad global alternativa. Configuración general, tarjetas y los otros ajustes de bienvenida siguen sus tareas de dominio. No cerrar T10/T16/T17 globalmente con esta pantalla ni dar por migrado todo EJS. La migración musical a lavalink-client, setups y logs conservan sus pendientes en el plan maestro.

La evidencia de verificación y el resultado operativo se registran en `evidence/frontend-next-20261023.json` y en el checkpoint vigente. Los verificadores temporales se retiran al cerrar la entrega, conservando los tres archivos originales de tests.
