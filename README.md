# OBEY YOUR MASTER

Bot de Discord con música, configuración del servidor, bienvenida, moderación, tickets y herramientas de comunidad. Este repositorio conserva la base de Tomato6966 y la remodela por capacidades, manteniendo los datos y las entradas compatibles.

**Estado al 01/11/2026:** en remodelación; [P0 cerrado](docs/platform/P0-REMOTE-2026-11-01.md), con la rotación Mongo excluida expresamente por el mantenedor. Continúa P1 música. El último despliegue verificado corresponde al código `2355287f`; su [informe de sesiones y permisos](docs/platform/P0-SESSION-2026-10-31.md) describe las pruebas y sus límites. La rama de implementación está publicada y su CI remoto pasó; el informe identifica el corte verificado. No se declara que todas las funciones estén aceptadas por disponer de comandos registrados.

## Empezar

- **Usar el bot:** abre `/info help` y `/setup` en Discord. El prefijo de texto es configurable; los ejemplos con `!` usan el predeterminado. La [guía de uso](docs/user/INICIO.md) explica configuración, música y Me gusta.
- **Instalar una instancia propia:** sigue [instalación y configuración](docs/operations/INSTALACION.md). Requiere tus propias credenciales, MongoDB y un nodo Lavalink v4; el repositorio no incluye el entorno privado del despliegue.
- **Entender el trabajo pendiente:** consulta el [índice de documentación](docs/README.md), el [plan activo](tasks/plan.md) y el [checkpoint](docs/platform/CHECKPOINT.md).
- **Contribuir o comunicar problemas:** consulta [CONTRIBUTING](CONTRIBUTING.md), [SUPPORT](SUPPORT.md) y [SECURITY](SECURITY.md). GitHub Issues y el formulario privado de vulnerabilidades están habilitados y verificados; los enlaces están en esas guías.

## Qué hay actualmente

| Área | Implementación y alcance |
| --- | --- |
| Discord | Comandos de texto y slash. Inventario: 661 adaptadores, 776 alias y 20 raíces slash/144 invocaciones. Son recuentos de entradas, no funciones aceptadas. |
| Música | Shoukaku 4 y Lavalink v4; selección de nodos, búsqueda, cola, controles, corazones y playlists. Fuentes permitidas: Spotify, YouTube, YouTube Music y Apple Music; HTTP para radio. La migración a lavalink-client y la aceptación completa de audio/continuidad siguen en P1. |
| Configuración | `/setup` como entrada central y asistentes compatibles. Bienvenida, registros y ajustes generales tienen recorridos compartidos en distinto grado de avance; la aceptación completa en dos servidores sigue en P2. |
| Web | Express, sesión Discord y EJS. El centro `/app/` usa Next.js, React y TypeScript mediante exportación estática. No se ha migrado todo el panel. |
| Datos y recursos | MongoDB; trabajos Redis/BullMQ opcionales; recursos OBEY y servicio de imágenes separado. Los materiales aprobados y las propuestas conservan estados distintos. |

No se reintroducen comandos NSFW, proveedores musicales retirados ni los comandos y audios retirados en [P0-C2](docs/platform/P0-SECURITY-2026-10-31.md). No se promete que un proveedor público ofrezca todos los plugins, baja latencia o disponibilidad continua. Premium, pagos y escalado conservan sus etapas de aceptación.

## Entorno y comprobaciones

La imagen y CI fijan **Node.js 22.23.4**. Usa los dos lockfiles; el frontend se instala por separado. La [guía de instalación](docs/operations/INSTALACION.md) incluye dependencias nativas, OAuth, nodos y persistencia antes de arrancar.

```sh
npm ci
npm ci --prefix dashboard/frontend --ignore-scripts
npm run web:build
```

Comprobaciones locales, sin arrancar el bot ni publicar comandos:

```sh
npm test
npm run typecheck:welcome
npm run dependencies:welcome
npm run web:typecheck
node scripts/verify-p0-classification.js
```

El código de arranque sincroniza el catálogo slash global: una instancia con token real puede publicar cambios. El registro sin diferencias no necesita un PUT. Las comprobaciones anteriores no sustituyen la aceptación conectada de música o administración.

## Código, historia y avisos

Las entradas siguen en `commands/`, `slashCommands/` y `events/`; los servicios y adaptadores están en `handlers/`, y la web en `dashboard/`. El árbol objetivo del plan es una migración gradual, no la estructura ya terminada.

El código conserva la [licencia MIT de Tomato6966](LICENSE). Consulta [THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES.md) para los avisos de componentes, fuentes y referencias. El [README anterior](docs/history/README-2026-10-31.md) se conserva como documento histórico; sus instrucciones, patrocinios y canales no acreditan el estado actual. Los cambios verificados y problemas conocidos figuran en [CHANGELOG](CHANGELOG.md).
