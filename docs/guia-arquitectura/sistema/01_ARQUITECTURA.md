# Arquitectura y tecnología

## Decisiones de diseño

Adoptar un monolito modular, con un proceso Gateway de Discord, los procesos de imágenes/jobs que ya sean necesarios y los nodos de audio separados. No introducir microservicios por cada categoría. Una capacidad puede degradarse sin bloquear la ayuda o funciones independientes; las capacidades que no puedan cumplir sus garantías se anuncian no disponibles.

Mantener CommonJS para no mezclar una migración completa de lenguaje con la sustitución del motor musical. Usar JSDoc y comprobación de tipos en contratos nuevos si se integra una herramienta de tipos; una conversión posterior a TypeScript requiere su propio cambio acotado. No crear tipos, validadores y formularios divergentes para un mismo dato.

| Tecnología | Decisión | Condición de adopción |
| --- | --- | --- |
| Node.js | Conservar línea 22 de la base durante la migración inicial | Fijar patch soportado y probado, mínimo efectivo de todas las dependencias; no usar el rango >=20 como garantía |
| discord.js | Conservar e integrar las APIs disponibles en el lockfile | Registrar versión efectiva; actualizar solo por función o corrección concreta |
| lavalink-client | Sustituir Shoukaku detrás del adaptador musical | Versión publicada exacta, CommonJS, eventos, store y nodos comprobados |
| Lavalink | Nodos v4 como primer objetivo | Voz, fuentes, plugins y recuperación compatibles con el cliente elegido |
| NodeLink | Adaptador opcional futuro | No anunciar funciones de NodeLink como si estuvieran en cualquier Lavalink |
| Mongoose/Mongo | Mantener datos durables existentes | Índices y topología confirmados antes de exigir transacciones |
| BullMQ/Redis | Reutilizar trabajos y coordinación existentes | Cola durable con política de persistencia, deduplicación y recuperación |
| Canvas/Canvacord | Reutilizar renderer por tipo de tarjeta | Un contrato de render; medir fuentes, memoria, caché y tiempos |
| Express/EJS/Socket.IO | Preservar consumidores web | No exponer escrituras directas que esquiven los casos de uso |
| Sentry/logger | Conservar e integrar | Redacción de secretos, correlación y errores estables |

`@discordjs/voice` y Opus no se eliminan por instalar lavalink-client: inventariar soundboard y cualquier audio local. Para reproducción resuelta por Lavalink, el trabajo de audio ocurre en el nodo. Retirar dependencias solo al demostrar que no tienen consumidores. No instalar todos los paquetes de Discord por catálogo: registrar cada import y necesidad; evitar una dependencia directa adicional si el export público de discord.js elegido ya resuelve ese uso.

## Distribución objetivo

| Ruta | Contenido | No debe contener |
| --- | --- | --- |
| `bootstrap/` | Composición y ciclo de vida | Reglas de tickets, música o saldos |
| `src/core/` | Router, contexto, registro y autorización común | Switches para cada detalle de cada módulo |
| `src/modules/<id>/index.js` | Única API pública del módulo | Exportación de objetos internos mutables |
| `src/modules/<id>/service.js` | Casos de uso y coordinación | Objetos Interaction o consultas desde vistas |
| `src/modules/<id>/policy.js` | Reglas de acceso propias | UI o estado de otro módulo |
| `src/modules/<id>/repository.js` | Acceso persistente del dominio | Respuestas de Discord |
| `src/modules/<id>/presentation/` | View models y composición | Escrituras de base de datos |
| `src/modules/<id>/transports/` | Slash, prefijo, componentes, eventos | Otra implementación de las reglas |
| `src/infrastructure/` | Mongo, Redis, Discord REST, nodos y proveedores | Políticas escondidas en utilidades globales |
| `src/shared/` | i18n, recursos, presentación y formatos comunes | Cajón de lógica de módulos |
| `assets/` | Binarios, fuentes y registro | Credenciales o IDs privados en SVG |

Estas son rutas de destino, no un árbol ya implementado. Un módulo pequeño puede empezar con `index`, `service`, `policy` y una vista; separar archivos cuando haya responsabilidades reales. No crear carpetas vacías para simular modularidad.

## Reglas de imports y autoridad

Transportes llaman a servicios; servicios usan políticas y repositorios propios; adaptadores implementan contratos de infraestructura. Otro módulo accede mediante `index.js`. El core no importa el dominio de música. La presentación recibe un snapshot de datos ya autorizado. El acceso global legacy a `client` se encapsula mientras se migran consumidores.

`handlers/feature-registry.js` sigue siendo el registro a ampliar. Sus manifests son metadatos y referencias a servicios, no un segundo runtime de plugins. `handlers/command-registry.js` sigue conciliando entradas cargadas y aliases. No registrar comandos para capacidades ausentes como si funcionaran.

Un servicio pequeño se cambia en su carpeta. Un texto se cambia en un catálogo. Un emoji se cambia en el registro. Un canal se cambia en configuración de guild. Estas cuatro operaciones no deben requerir editar un mismo archivo gigante.

## Proceso y propiedad

Gateway mantiene interacciones y la sesión musical de sus guilds. Workers toman trabajos de imágenes, entregas y transcripciones que ya lo justifiquen. El nodo mantiene la reproducción. Mongo conserva configuración e información durable; Redis/BullMQ coordinan trabajos. Un `guildId` pertenece a un solo propietario de reproducción activo.

Antes de ejecutar varios procesos capaces de tomar la misma guild: propiedad con lease, generación y fencing en escrituras/efectos. El propietario anterior deja de emitir efectos al perder autoridad. Un lock local no se presenta como coordinación distribuida.

## Cambios sin reescritura masiva

Migrar por recorrido completo y conservar adaptadores legacy. Primero bienvenida; luego música y operaciones. Mover un archivo no acredita separar negocio. Retirar el camino antiguo solo después de conciliar consumidores, datos, interacciones persistentes y cierre.
