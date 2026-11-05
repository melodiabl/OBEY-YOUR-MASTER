# Música: primera unidad migrada

Este árbol contiene código activo, compartido por los comandos y la API. Sigue las responsabilidades del plan recibido; el resto del motor todavía está en `handlers/music` durante la migración.

```text
bot/modulos/musica/
├── comandos/
│   ├── buscar.js       # Interacciones del selector y autorización al elegir
│   └── controlar.js   # Entrada común de pause/resume/skip/stop prefix y slash
├── servicios/
│   └── catalogo.js    # Consulta compartida e inserción autorizada de resultados
├── datos/
│   └── catalogo.js    # Consultas por tipo/fuente en nodos públicos y caché
└── vistas/
    ├── catalogo.js    # Embeds y componentes de búsqueda
    └── respuestas.js  # Presentación de confirmaciones y errores

api/rutas/musica/
└── http.js            # Adaptador HTTP del catálogo del player
```

`dashboard/index.js` conserva el registro de rutas y sus middleware de sesión, permisos frescos y CSRF. HTTP utiliza `servicios/catalogo.js`; no importa comandos ni vistas de Discord. La interfaz del navegador consume HTTP y eventos; no importa este código del servidor.

Los archivos anteriores `handlers/discordmusiccatalog.js`, `handlers/music/catalog-search.js`, `catalog-picker.js`, `playui.js` y `responses.js` se retiraron tras actualizar sus consumidores. También se eliminó `searchui.js`: no tenía consumidores activos y duplicaba una vista sustituida. No se conservan reexportaciones en las rutas retiradas.

La frontera temporal con `handlers/music` corresponde a nodos, SDK, estado, políticas de grabación, artistas y permisos existentes. NyxLink mantiene la reproducción y su cola. La próxima unidad debe trasladar recorridos completos con sus consumidores y retirar las ubicaciones sustituidas; no crear directorios vacíos ni duplicar la autoridad de estado.

El player EJS sigue en uso mientras React no cubra búsqueda, navegación por artistas/álbumes, cola y biblioteca. Esta migración no cambia las rutas públicas, los nombres de comandos, los datos ni los materiales visuales. No acredita la migración completa de música ni del frontend.

El catálogo inicial de la web es un recorrido distinto de buscar: debe cargar datos del proveedor sin una consulta escrita por el usuario. La consulta compartida de esta unidad no sustituye esa portada ni debe presentar búsquedas genéricas como tendencias oficiales.

Ver [comparación y correcciones de comandos](../../../docs/platform/MUSIC-COMMAND-AUDIT-2026-11-05.md) y [plan conciliado](../../../docs/platform/PLAN-2026-11-02.md).
