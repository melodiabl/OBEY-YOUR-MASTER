# 09 · Arquitectura web Next.js + React

**Diseño objetivo, no implementado.** Abrir `ARBOL_WEB_COMPLETO.txt` para nombres completos de carpetas y archivos.

## Arquitectura por responsabilidades

- `web/app/`: páginas, layouts, loading/error y rutas de Next. Los `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx` mantienen los nombres que Next necesita; no cambiarlos por traducciones.
- `web/componentes/`: elementos reutilizables que no conocen lógica de un módulo particular.
- `web/modulos/`: componentes, hooks y tipos de interfaz específicos (Builder, música, tickets, etc.). El control de negocios no vive aquí.
- `web/servicios/`: cliente API, sesión, notificaciones, respuestas normalizadas y transporte; nunca consultar Mongo directamente desde UI.
- `web/tipos/`: contratos de entrada/salida, pero el esquema canónico lo comparte `compartido/contratos/`.
- `web/estilos/`: tokens existentes y estilos, sin duplicaciones de tema por módulo.
- `api/`: capa Express actual como autoridad de autorización, sesiones, REST, tareas y tiempo real; una sola ruta de escritura hacia servicios compartidos con el bot.
- `bot/`: propietario de operaciones Discord y la reproducción canónica Lavalink. No autorizar desde la web comandos usando IDs de guild enviados sin verificación.

## Regla para TypeScript y JavaScript

- `*.tsx`: React con JSX (pantallas, widgets, modales, editores, navegación).
- `*.ts`: tipado, transporte, contratos, validadores, hooks, configuración y código sin JSX.
- `*.js`: integración actual de Discord, backend Express y módulos originales, mientras no haya una migración tipada probada. **No convertir miles de JS a TS solo para aparentar modernidad.**
- `route.ts`: únicamente si se decide ejecutar Next en modo servidor; no introducirlo para operaciones dinámicas durante `output:'export'`.

## Rutas

- `/panel` → servidores administrables.
- `/panel/[servidor]` → resumen del servidor elegido.
- `/panel/[servidor]/builder` → Constructor, plantillas, editor, diferencias, historial.
- `/panel/[servidor]/musica` → reproductor, cola, favoritos.
- `/panel/[servidor]/moderacion`, `seguridad`, `registros`, `tickets`, `comunidad`, `automatizaciones`, `estadisticas`, `ajustes`.

Las rutas reales de la landing y del backend se mantienen hasta reconciliación. Versionar redirecciones sin romper enlaces históricos (incluidos `/architect/:guildId`).

## Módulos de producto, no 32 páginas obligatorias

La navegación agrupa capacidades; la disponibilidad de una pantalla depende de un permiso y una implementación realmente existente. Un catálogo puede mostrar «próximamente» solo si está rotulado, sin botones de guardar falsos.

## Cómo se conecta

Navegador → React/Next UI → cliente API tipado → Express autenticado → servicios de negocio → bot/DB/colas. Eventos → Socket.IO o SSE con control de tenant → hooks del módulo React. No abrir directamente los sockets del motor Lavalink desde el navegador.

## Código de referencia

Los archivos bajo `ejemplos/` son **fragmentos de diseño**, no un frontend listo para ejecutar o desplegar. Las rutas, imports y paquetes deben adaptarse al árbol real durante implementación.
