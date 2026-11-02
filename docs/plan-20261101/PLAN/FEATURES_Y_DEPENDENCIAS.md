# OBEY — Plan de funcionalidades y dependencias

**Fecha:** 1 de noviembre de 2026  
**Estado:** propuesta para revisar, sin instalar paquetes ni modificar GitHub, el bot o el VPS.  
**Ámbito:** bot Discord, API, panel interno React/Next.js, audio Lavalink, Builder (antes Architect), servicios y pruebas.  
**Invariantes:** landing intacta; panel conserva colores actuales `#161923`, `#1E222E`, `#252A37`, `#5865F2`, `#98A3FF`; los emojis y GIF aprobados A01–A12 pertenecen al bot, no al diseño general de la web. Archivos con nombres cortos. No reactivar funciones retiradas.

## 1. Base real de la rama consultada

- Backend principal: Node >=22.23.4, `discord.js` con manifiesto `^14.18.0`, Shoukaku `^4.3.0`, Express `^4.21.2`, Mongo/Mongoose, BullMQ, Redis, Socket.IO, Zod y Sentry.
- Web: Next 16.4.3, React 19.3.1, TypeScript 5.9.3, `socket.io-client` 4.8.3.
- La web Next se compila actualmente con `output: 'export'`; su funcionalidad dinámica la sirven rutas Express. La migración a rutas de servidor de Next requiere cambiar el modo de ejecución, o conservar una API Fastify independiente.
- El plan de GitHub marca P0 cerrado y P1 de audio con migración a `lavalink-client` pendiente. La documentación de entrega previa no equivale a una prueba de producción.

## 2. Objetivos funcionales (features)

| Prioridad | Función | Resultado observable | Aceptación mínima |
|---|---|---|---|
| P0 | Registro de módulos y permisos por servidor | Activar y configurar módulos desde Discord y web | Mismo estado en ambas superficies; sin permisos no hay cambios |
| P0 | Contratos compartidos de API | Web, API y bot acuerdan tipos y errores | Validación de entradas/salidas, pruebas de contrato, sin IDs arbitrarios |
| P0 | Sesiones y seguridad | OAuth Discord y seguridad equivalentes a la base actual | CSRF, revocación, aislamiento por servidor, rate limit, auditoría |
| P1 | Música con `lavalink-client` | Play, pause, skip, queue, repeat, shuffle, autoplay, lyrics | Una sola autoridad de cola; saltos sin duplicar; pruebas con nodo real |
| P1 | Música web en tiempo real | Estado del reproductor consistente con Discord | Reconexión, autorización y estado confirmado; no estado ficticio |
| P1 | Builder visual (antes Architect) | Crear/editar canales, roles, permisos, categorías y plantillas | Vista previa de cambios, confirmación, concurrencia, rollback probado |
| P1 | Mensajes Discord V2 | Plantillas de música, tickets, moderación, registros | Serialización de componentes, límites Discord, fallback y permisos |
| P1 | Biblioteca de materiales | Recursos A aprobados, B bajo revisión | Registro único, SHA, IDs reales solo si publicados, animación por estado |
| P2 | Editor de mensajes por servidor | Texto, variables, idioma y vista previa | Validaciones y previsualización fiel; sanitizar menciones |
| P2 | Moderación y logs avanzados | Casos, auditoría de eventos, filtros, automod | Identidad actor/objetivo/fecha, datos mínimos, deduplicación |
| P2 | Tickets y soporte | Formularios, colas de atención, transcripción, SLA | Accesos privados, cierre seguro, evitar tickets duplicados |
| P2 | Automatizaciones | Triggers, condiciones, acciones y simulación | Previsualizar, pausar, reintentos acotados, seguimiento de ejecuciones |
| P2 | Experiencia del panel | Buscador Ctrl+K, historial, borradores, accesibilidad | Guardar sin pérdida, responsive, reduced motion, carga/error/vacío |
| P2 | Analíticas | Métricas de uso por servidor, fallos y música | Diferenciar no disponible de cero, controles de privacidad |
| P3 | Escala | Sharding y trabajos distribuidos bajo demanda real | Métricas antes de agregar procesos; no doble procesamiento |

## 3. Decisiones de dependencias

### Incorporar por fases

| Fase | Paquete | Destino | Motivo |
|---|---|---|---|
| P1 | `lavalink-client` | Bot/audio | Reemplazo de Shoukaku y único gestor de reproductores |
| P1 | `fastify` | API | Backend separado, rutas modulares y schemas |
| P1 | `@fastify/cookie`, `@fastify/helmet`, `@fastify/rate-limit`, `@fastify/csrf-protection` | API | Mantener controles de seguridad; verificar versiones compatibles |
| P1 | `@fastify/swagger` y opcional `@fastify/swagger-ui` | API | Inventario documentado de contratos y rutas |
| P1 | `@tanstack/react-query` | Web | Estado remoto con caché, mutaciones y recarga consistente |
| P1 | `motion` | Web | Transiciones de layout, modales y reordenamiento con reduced motion |
| P1 | `@dnd-kit/react` (y `@dnd-kit/helpers` si hace falta) | Web/Builder | Reordenar canales, roles, secciones y bloques |
| P1 | Componentes `shadcn/ui` seleccionados | Web | Componentes editables de accesibilidad: diálogo, tabs, comandos, sidebar |
| P2 | `react-hook-form` y `@hookform/resolvers` | Web | Formularios con validación Zod |
| P2 | `vitest` | Tests web y servicios TS | Pruebas rápidas complementarias a `node:test` existente |
| P2 | `@playwright/test` | Pruebas E2E | Flujos de OAuth, permisos, Builder, música y responsive |
| P2 | `@fastify/otel` **o** instrumentación OpenTelemetry validada | API/observabilidad | Tracing entre API, jobs y bot; no duplicar Sentry |

### Conservar y aprovechar

`zod`, `mongoose`, `bullmq`, Redis y cliente existente, `socket.io` y `socket.io-client`, `@sentry/node`, `@napi-rs/canvas`, TypeScript. Reusar datos/servicios existentes antes de cambiar almacenamiento, mensajería o motor de render.

### Retirar solo al final de su sustitución

- `express`, `express-session`, `connect-mongo`, `ejs`: tras migrar autenticación, cookies, CSRF, vistas, sesiones y rutas; para sesiones revocables elegir un almacenamiento persistente compatible con la semántica actual.
- `shoukaku`: tras comprobar `lavalink-client` y dejar una sola cola por servidor; no ejecutar dos motores activos.
- `request`, `request-promise-native`, `node-fetch` v2, `got` v11 y peticiones duplicadas: inventariar consumidores; migrar a `fetch` de Node/`undici` cuando corresponda, sin quitar paquetes usados.
- Paquetes canvas, traducción o música redundantes: solo después de comparar consumidores y pruebas.

### No añadir por costumbre

Un ORM nuevo (Prisma/Drizzle) junto a Mongoose, Redux para duplicar React Query, otros motores de audio, un segundo sistema de colas, paquetes de iconos personalizados para copiar los emojis de Discord, microservicios y clústeres sin métricas. Un paquete no corrige arquitectura o permisos por sí solo.

## 4. Arquitectura propuesta con nombres cortos

```text
OBEY/
├── bot/
│   ├── index.js
│   ├── discord/
│   │   ├── comandos.js
│   │   ├── interacciones.js
│   │   ├── eventos.js
│   │   ├── permisos.js
│   │   └── mensajes.js
│   ├── audio/
│   │   ├── lavalink.js
│   │   ├── reproductor.js
│   │   └── cola.js
│   └── modulos/
│       ├── musica/
│       ├── builder/
│       ├── moderacion/
│       ├── seguridad/
│       ├── tickets/
│       ├── registros/
│       └── [resto de módulos según inventario maestro]
├── web/                         # React/Next, landing intacta
│   ├── app/
│   ├── componentes/
│   ├── modulos/
│   ├── hooks/
│   ├── servicios/
│   ├── estilos/
│   └── pruebas/
├── api/                         # Fastify + TS
│   ├── index.ts
│   ├── rutas/
│   ├── servicios/
│   ├── seguridad/
│   └── tiempo-real/
├── compartido/
│   ├── contratos/
│   ├── idiomas/
│   └── permisos/
└── pruebas/
```

**Regla:** un servicio de negocio tiene una sola autoridad; bot y API lo llaman a través de contratos, nunca duplican validaciones, permisos o colas. La web no importa módulos que dependen directamente del proceso de Discord. `index.js` solo donde constituye la entrada real de una aplicación o módulo.

## 5. UX: funcionalidades específicas a implementar

**Builder:** explorador de canales y roles, drag-and-drop, editor central, inspector lateral, plantillas, permisos, vista previa de diferencias, simulación, aplicación confirmada, progreso respaldado por jobs, historial reversible y avisos de conflicto.

**Música:** panel de reproducción, cola editable autorizada, búsquedas/autocomplete, DJ role, filtros si el nodo lo soporta, reconexión, volumen, autoplay confiable, favoritos privados, lista de nodos y telemetría de fallos. Las acciones cambian el estado únicamente cuando el servidor confirma.

**Personalización Discord:** vista previa real por estado (reposo, pendiente, éxito, fallo), materiales A01–A12 y B bajo revisión, traducciones por servidor, variables seguras, límites de Discord, botón deshabilitado cuando la acción no corresponda. Components V2 requieren `IsComponentsV2`; una respuesta no mezcla libremente contenido/embeds clásicos y V2.

**Web:** mantener `#161923`, `#1E222E`, `#252A37`, `#5865F2`, `#98A3FF`. Motion para movimientos significativos (abrir/cerrar, reordenamiento y feedback) y CSS para hover simple; respetar `prefers-reduced-motion`. No introducir pack de GIF ni estética del personaje como tema global web.

## 6. Condiciones de compatibilidad y seguridad

1. No ejecutar `npm install ...@latest` indiscriminadamente: comprobar engines de las versiones actuales. La documentación consultada de discord.js v14.27 advierte requisitos Node más recientes que el runtime 22 del proyecto; definir una matriz versión-runtime-lockfile antes del salto.
2. Asegurar equivalencia de sesiones OAuth y logout con revocación; un reemplazo `@fastify/secure-session` sin estado puede alterar las garantías actuales de invalidación.
3. Mantener `same-origin` donde sea posible, no instalar CORS innecesariamente, validar origin en Socket.IO y HTTP, exigir CSRF en mutaciones y permisos frescos por servidor.
4. Migrar Express con pruebas de paridad HTTP; no borrar vistas EJS ni rutas antiguas hasta comprobar cada reemplazo.
5. Verificar límites de acciones Discord, idempotencia y reintentos, cola única, persistencia y fallbacks de los recursos publicados.
6. Cambiar componentes de interfaz sin inventar ni duplicar estados de negocio.

## 7. Orden de ejecución y criterios de cierre

1. **Inventario y baseline:** registrar archivos, rutas, dependencias, comandos y flujos activos; snapshot/hashes y CI.
2. **Contratos y API:** rutas Fastify, seguridad y sesiones equivalentes con pruebas de paridad; pruebas de canales HTTP/SSE/Socket.IO.
3. **Música:** `lavalink-client` con tests aislados y nodo real; transiciones/reconexiones, confirmar que Shoukaku puede retirarse.
4. **Builder:** primero vista previa, permisos y rollback; luego operaciones reales acotadas por guild.
5. **Web interna:** conectar React/Next a la API; transformar páginas EJS sin tocar landing ni la paleta.
6. **Módulos Discord:** aplicar Components V2 y materiales aprobados, probar estados, permisos e idiomas.
7. **Limpieza:** eliminar duplicados, dependencias y rutas legacy tras la matriz de aceptación y rollback.
8. **Escalado:** optimizar con métricas y decidir sharding/clusters solo cuando exista necesidad demostrable.

**No completado en esta entrega:** instalación de paquetes, tests end-to-end, migración de datos, cambio de runtime, despliegue o renovación del repositorio.

## 8. Fuentes oficiales

- https://www.npmjs.com/package/lavalink-client
- https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/
- https://fastify.dev/docs/latest/Guides/Ecosystem/
- https://nextjs.org/docs/app/guides/static-exports
- https://discord.js.org/docs
- https://discordjs.guide/legacy/popular-topics/display-components
- https://motion.dev/docs/react
- https://tanstack.com/query/latest/docs/framework/react/guides/queries
- https://dndkit.com/react/quickstart/
- https://ui.shadcn.com/docs/components
- https://main.vitest.dev/guide/
