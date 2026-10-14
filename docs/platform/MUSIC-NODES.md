# Nodos de música y retirada de WARP

Petición del usuario: retirar WARP de Lavalink/OBEY, añadir distintos nodos públicos y conservar su nodo como principal/respaldo interno oculto al público. Esta instrucción actualiza el backend permitido de Soundy; conserva el único servicio musical, sus sesiones, cola y los doce controles existentes.

## Contrato de implementación

- Credenciales/dirección del nodo privado exclusivamente en configuración del servidor. Los nodos públicos tienen credenciales separadas, HTTPS/WSS y registro aprobado por el operador; ninguna contraseña privada se reutiliza en un nodo público.
- Automático prioriza el nodo interno y recurre a los públicos disponibles. Selección pública por guild, persistida y comprobada al ejecutar. IDs arbitrarios/privados y nodos desconectados se rechazan; el cliente no envía hosts ni contraseñas.
- Listados/API/interfaz solo devuelven etiquetas, IDs públicos y disponibilidad. La conexión interna aparece como Automático sin su identidad/dirección. Errores no muestran URLs ni credenciales.
- Búsqueda, unión a voz y recuperación utilizan el mismo pool. Una caída permite recuperar la sesión en otro nodo. Al cambiar, se resuelve la pista en el destino y se conservan cola, volumen (incluido cero), pausa, posición y filtros; fallo conserva/restaura estado, sin anunciar un éxito no persistido.
- Una página de conexiones y comandos de nodos permiten elegir sin reemplazar el reproductor Soundy. Configure requiere ManageGuild actualizado; mismas barreras OAuth/CSRF/aislamiento de guild existentes.
- No publicar endpoints de contenido adulto de plugins de terceros como funciones musicales. Bloquear las fuentes/enlaces adultos identificados; no reintroducir los comandos NSFW retirados.
- Retirar argumentos/configuración/plugin de WARP y desactivar el servicio después de preparar y verificar la salida directa/pool. El Lavalink propio escucha en loopback. No modificar Lavalink público ni instalar WARP en proveedores externos.

## Material actualizado

ZIP SHA-256 `582121c92cf9454bdbc4c86326a47c8470ab5356d09abf0abfae3f847a8553ed`, 1368 archivos verificados en `/home/OBEY_Documentacion_actualizada_2026-10-14`; ZIP eliminado tras extracción/integridad. Validadores del paquete: 32 contratos, 492 referencias de archivos y 2149 enlaces locales correctos, más cobertura de Adaptación al servidor. La carpeta anterior se conserva; la actual guía la continuación. No se copió el paquete entero al dashboard ni se sustituyen datos del bot por sus fixtures.

La ampliación exige reutilizar recursos por ID/propósito, scopes y diagnóstico, sin apropiarse de canales/roles ajenos ni inventar integración con otros bots. Continúa sobre las bases compartidas y los consumidores actuales; las 16 entradas locales previas de Architect/evidencias permanecen fuera de esta entrega.

## Fuentes

[Shoukaku: resolver compartido](https://shoukaku.shipgirl.moe/documents/Guide.Common_Usage.html), [Lavalink REST](https://lavalink.dev/api/rest.html), [operador TriniumHost](https://lavalink-status.triniumhost.com), y configuración/comprobación directa del operador de cada nodo. Disponibilidad y búsqueda se verifican en el entorno; una búsqueda no demuestra salida de audio audible en Discord.

## Operación

`LAVALINK_HOST`, `LAVALINK_PORT`, `LAVALINK_PASSWORD` y `LAVALINK_SECURE` describen exclusivamente el nodo interno. Compose monta `.runtime/nodes` como lectura y establece `LAVALINK_NODES_FILE=/app/runtime-nodes/nodes.json`. El registro es JSON `{ "version": 1, "nodes": [...] }`; cada entrada contiene `id`, `label`, `visibility: "public"`, `host` (sin URL), `port`, `password` del propio proveedor, `secure: true` y `priority`. Solo el operador edita este archivo. Directorio 0750, archivo 0640, grupo del usuario del bot. Reiniciar únicamente el bot al cambiar el registro. No publicar el archivo ni usar la contraseña interna como respaldo.

Seleccionar desde Conexiones de música en el panel, `/nodes connection:ID` o `nodes ID`; `auto` devuelve la selección automática. Requiere permiso actual de administrar el servidor. El cambio se persiste en la sesión de cada guild, incluidas sesiones sin canción. Los nodos desconectados siguen visibles con su estado pero no se pueden elegir.

TriniumHost y Nazha son servicios públicos de terceros. Se comprobaron `/v4/info` 4.2.2 y búsquedas YouTube de 20 resultados en ambos. Sus plugins ajenos al dominio musical no se ofrecen mediante OBEY: el servicio compartido filtra fuentes adultas, fuentes no musicales y flags explícitos presentes. El nodo propio desactiva esos plugins. Los metadatos de los proveedores no siempre identifican contenido explícito; esto no constituye clasificación exhaustiva de letras o vídeos.

## Verificación de código

386 pruebas pasan. El navegador aislado verifica 320/768/1024/1440 px, teclado, persistencia tras recarga, error de guardado, permisos revocados, CSRF y opciones desconectadas. Evidencia en `evidence/music-nodes/`; usa fixtures declaradas y no representa audio audible en Discord. Auditoría de dependencias: 36 moderadas, cero altas/críticas, sin cambios de dependencias.

La sonda de audio directo encontró rechazo de YouTube por la IP del servidor («confirm you are not a bot»). No se registra como audio aprobado. El pool puede recuperar la URI por otro proveedor y mantener cola/volumen/pausa/posición; las pruebas de ese comportamiento se ejecutan con reproductores controlados. No se entró a un canal de voz real para probar audio.
