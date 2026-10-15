# Nodos de música y retirada de WARP

Petición del usuario: retirar WARP de Lavalink/OBEY, añadir distintos nodos públicos y conservar su nodo como principal/respaldo interno oculto al público. Esta instrucción actualiza el backend permitido de Soundy; conserva el único servicio musical, sus sesiones, cola y los doce controles existentes.

## Cambio vigente: solo públicos

El usuario pidió apagar su nodo y elegir un principal público. `LAVALINK_PRIVATE_ENABLED=false` excluye todos los nodos privados, tanto de entorno como legacy/registro; sus credenciales se conservan sin reutilizarlas. `LAVALINK_DEFAULT_NODE=nazha` fija el principal para modo Automático; Serenetia/MilloHost respaldan y Trinium sigue desactivado. El contenedor propio queda creado sin iniciar, política `restart=no`, perfil manual y puerto 2333 cerrado. No se borraron configuración ni plugins.

Las peticiones REST de reproducción fallidas también recuperan sesión; se prueban los siguientes respaldos si el primero falla. Si fallan todos, se conserva canción/cola/posición y se espera recuperación, incluso ante eventos duplicados. 392 tests pasan.

La prueba autorizada por el usuario en THZ usó VC1 (canal vacío disponible), con volumen cero y sin publicar mensajes de prueba. Lavalink informó conexión de voz y progreso real: Nazha 3060 ms, respaldo Serenetia 4541 ms; pausa, cola de una pista, mute y sesión conservados. El estado anterior se restauró y quedó Nazha seleccionado. Esto verifica el flujo de audio del servidor; no es confirmación auditiva humana. [Evidencia](evidence/music-nodes/thz-public-only.json).

## Contrato de implementación

- Credenciales/dirección del nodo privado exclusivamente en configuración del servidor. Los nodos públicos tienen credenciales separadas, HTTPS/WSS y registro aprobado por el operador; ninguna contraseña privada se reutiliza en un nodo público.
- Con nodo privado habilitado, Automático puede priorizar el interno; en el despliegue vigente usa exclusivamente el público seleccionado y sus respaldos. Selección pública por guild, persistida y comprobada al ejecutar. IDs arbitrarios/privados y nodos desconectados se rechazan; el cliente no envía hosts ni contraseñas.
- Listados/API/interfaz solo devuelven etiquetas, IDs públicos y disponibilidad. La conexión interna aparece como Automático sin su identidad/dirección. Errores no muestran URLs ni credenciales.
- Búsqueda, unión a voz y recuperación utilizan el mismo pool. Una caída permite recuperar la sesión en otro nodo. Al cambiar, se resuelve la pista en el destino y se conservan cola, volumen (incluido cero), pausa, posición y filtros; fallo conserva/restaura estado, sin anunciar un éxito no persistido.
- Una página de conexiones y comandos de nodos permiten elegir sin reemplazar el reproductor Soundy. Configure requiere ManageGuild actualizado; mismas barreras OAuth/CSRF/aislamiento de guild existentes.
- No publicar endpoints de contenido adulto de plugins de terceros como funciones musicales. Bloquear las fuentes/enlaces adultos identificados; no reintroducir los comandos NSFW retirados.
- Retirar argumentos/configuración/plugin de WARP y desactivar el servicio después de preparar y verificar la salida directa/pool. El Lavalink propio escucha en loopback. No modificar Lavalink público ni instalar WARP en proveedores externos.

## Material actualizado

ZIP SHA-256 `582121c92cf9454bdbc4c86326a47c8470ab5356d09abf0abfae3f847a8553ed`, 1368 archivos verificados en `/home/OBEY_Documentacion_actualizada_2026-10-14`; ZIP eliminado tras extracción/integridad. Validadores del paquete: 32 contratos, 492 referencias de archivos y 2149 enlaces locales correctos, más cobertura de Adaptación al servidor. Esta extracción fue reemplazada por el ZIP del 15/10 y se eliminó durante la limpieza; la fuente vigente está descrita en LATEST-PACKAGE.md. No se copió el paquete entero al dashboard ni se sustituyen datos del bot por sus fixtures.

La ampliación exige reutilizar recursos por ID/propósito, scopes y diagnóstico, sin apropiarse de canales/roles ajenos ni inventar integración con otros bots. Continúa sobre las bases compartidas y los consumidores actuales; las 16 entradas locales previas de Architect/evidencias permanecen fuera de esta entrega.

## Fuentes

[Shoukaku: resolver compartido](https://shoukaku.shipgirl.moe/documents/Guide.Common_Usage.html), [Lavalink REST](https://lavalink.dev/api/rest.html), [operador TriniumHost](https://lavalink-status.triniumhost.com), y configuración/comprobación directa del operador de cada nodo. Disponibilidad y búsqueda se verifican en el entorno; una búsqueda no demuestra salida de audio audible en Discord.

## Operación

`LAVALINK_HOST`, `LAVALINK_PORT`, `LAVALINK_PASSWORD` y `LAVALINK_SECURE` describen exclusivamente el nodo interno. Compose monta `.runtime/nodes` como lectura y establece `LAVALINK_NODES_FILE=/app/runtime-nodes/nodes.json`. El registro es JSON `{ "version": 1, "nodes": [...] }`; cada entrada contiene `id`, `label`, `visibility: "public"`, `host` (sin URL), `port`, `password` del propio proveedor, `secure: true` y `priority`. Solo el operador edita este archivo. Directorio 0750, archivo 0640, grupo del usuario del bot. Reiniciar únicamente el bot al cambiar el registro. No publicar el archivo ni usar la contraseña interna como respaldo.

Seleccionar desde Conexiones de música en el panel, `/nodes connection:ID` o `nodes ID`; `auto` devuelve la selección automática. Requiere permiso actual de administrar el servidor. El cambio se persiste en la sesión de cada guild, incluidas sesiones sin canción. Los nodos desconectados siguen visibles con su estado pero no se pueden elegir.

TriniumHost y Nazha son servicios públicos de terceros. Se comprobaron `/v4/info` 4.2.2 y búsquedas YouTube de 20 resultados en ambos. Sus plugins ajenos al dominio musical no se ofrecen mediante OBEY: el servicio compartido filtra fuentes adultas, fuentes no musicales y flags explícitos presentes. El nodo propio desactiva esos plugins. Los metadatos de los proveedores no siempre identifican contenido explícito; esto no constituye clasificación exhaustiva de letras o vídeos.

## Verificación de código

387 pruebas pasan. El navegador aislado verifica 320/768/1024/1440 px, teclado, persistencia tras recarga, error de guardado, permisos revocados, CSRF y opciones desconectadas. Evidencia en `evidence/music-nodes/`; usa fixtures declaradas y no representa audio audible en Discord. Auditoría de dependencias: 36 moderadas, cero altas/críticas, sin cambios de dependencias.

La sonda de audio directo encontró rechazo de YouTube por la IP del servidor («confirm you are not a bot»). No se registra como audio aprobado. El pool puede recuperar la URI por otro proveedor y mantener cola/volumen/pausa/posición; las pruebas de ese comportamiento se ejecutan con reproductores controlados. No se entró a un canal de voz real para probar audio.


Actualización de proveedores: Trinium conectado pero búsqueda agotó plazos de 20 y 30 segundos; se conserva desactivado. Nazha queda primero entre los públicos. Serenetia y MilloHost añadidos tras verificar sesión WebSocket en `/v4/websocket` y 20 pistas de búsqueda por sus APIs v4. Sus versiones son snapshots (major 0), por lo que la compatibilidad se comprueba por protocolo/respuestas y no por un número semver supuesto. Los plugins opcionales se aplican solo si la inspección de capacidades los confirma. Registro privado con tres públicos activos y Trinium desactivado.

Una regresión adicional comprueba controles simultáneos: durante la transición los setters inmediatos devuelven un error para reintentar; las operaciones serializadas esperan su turno. Se terminan escrituras de volumen aceptadas antes de tomar el snapshot. Así no se confirma un control para después perderlo al restaurar la sesión.


## Despliegue final

Código `4431bc9e`, imagen `f919bc076e9b4f7c485c091d63d807ddbc0cc0534a02840ca238aa1b19edc2ca`. Verificación en ejecución: nodo interno + tres públicos conectados, cada público con 20 pistas; salud 200, recursos JS/CSS publicados iguales al snapshot, página exige sesión y API devuelve 401 sin ella. WARP no instalado/no servicio/no listener de proxy. Solo bot y Lavalink recreados, imágenes/Redis conservados. [Evidencia](evidence/music-nodes/runtime.json). Recuperación mediante `.runtime/bot-recovery-nodes.yml` y `.runtime/lavalink-recovery-direct.yml`, conservando la configuración privada sin WARP ni fuentes adultas. No restaurar bases de datos automáticamente.


Despliegue vigente exclusivamente público: código `f73d04dc`, imagen `74b4d1f893fc461c2e2aefaaea2ad98465132a19645480ae4962f977637c2310`. [Estado final](evidence/music-nodes/public-only-runtime.json). Recuperación `.runtime/bot-recovery-public-only.yml` conserva públicos, principal Nazha y privado excluido; no iniciar Lavalink ni restaurar los overrides antiguos con privados. La prueba temporal de voz quedó retirada y su resultado se mantiene privado en el servidor.

## Actualización de letras/autoplay · 15/10/2026

La versión vigente es `8b1725a8`, imagen `849b2ebff87f45089c2bc10b856a12b4f8f2d055dbcd210eeb44ed24f6e920c4`, con privados apagados y excluidos. Nazha principal y Serenetia/MilloHost conectados; imagen/arranque de imágenes y Redis conservados. Recuperación pública fijada a esta versión. [Letras, autoplay y límites de comprobación](MUSIC-SYNC.md), [ejecución](evidence/music-sync-runtime.json). Los despliegues anteriores de este documento son históricos.
