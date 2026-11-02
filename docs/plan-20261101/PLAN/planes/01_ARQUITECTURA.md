# 01 · Arquitectura de OBEY — propuesta definitiva para aprobación

## Principios obligatorios

- **Una sola base**, sin convivir permanentemente dos arquitecturas. La migración debe ser transaccional por módulo: compatibilidad temporal, pruebas, corte y eliminación de puente.
- Nombres de archivos cortos y contextuales. `index.js`, `cola.js`, `reproductor.js`, `permisos.js`, `client.js`. No `iniciar-bot.js`, `bot.commander.js` ni `modulo.js` genérico en 32 carpetas.
- No renombrar comandos visibles sin aprobación: el nombre de la función de Discord y el nombre de archivo son cosas diferentes.
- **Un servicio por función de negocio**, compartido por prefijo, slash, botones, menús, trabajos y web. Evitar dos colas musicales o dos validadores de permisos divergentes.
- Dependencias: `bot/modulos` depende de `compartido` y adaptadores; `web/` se implementará con React + Next.js (App Router); componentes de navegador nunca importan servicios internos del bot ni reciben credenciales. Las operaciones servidor/API consumen contratos de dominio validados.
- Mongo/Redis y contratos de datos preservados con planes de migración versionados; el diseño visual es configuración, nunca fuente de verdad de sanciones, economía o permisos.
- Mantener CommonJS inicialmente si la base real lo exige, y estabilizar antes de cambiar a ESM/TypeScript. No hacer doble cambio estructural sin pruebas.
- No dejar módulos vacíos como si estuvieran operativos. Los que carecen de dominio confirmado permanecen diferidos.

## Carpetas y archivos

Árbol íntegro: `ARBOL_COMPLETO_PROPUESTO.txt` (32 carpetas y nombres de todos los JS propuestos). Es el **destino**, no una carpeta instalada en producción.

## Ejemplo de separación de responsabilidades

`bot/modulos/musica/comandos/reproducir.js`: valida argumentos e interacción; delega la operación.  
`bot/modulos/musica/servicios/reproducir.js`: coordina búsqueda, cola y permisos musicales.  
`bot/modulos/musica/vistas/reproductor.js`: construye la vista Discord; no muta la cola.  
`bot/conexiones/lavalink.js`: configuración de nodos y gateway; no contiene comandos.

## Contratos mínimos

Cada operación recibe `{guildId, actorId, locale, requestId, ...argumentos}` y devuelve resultado tipado `{ok, code, data}` con un único identificador de sesión/revisión. Los eventos de dominio son idempotentes. `customId` incluye namespace y versión; debe rechazar uso cruzado de guild/usuario, caducidad y dobles pulsaciones.

## Fronteras

No mover indiscriminadamente 674 archivos de comando. Primero identificar loaders, rutas dinámicas, serialización, permisos, pruebas y consumidores web. Resolver nombres repetidos (`play`, `github`) por namespace, **sin** romper nombres visibles.

## Estado de esta entrega

Arquitectura documentada. Cero archivos de producción modificados. Sin certificación de runtime.
