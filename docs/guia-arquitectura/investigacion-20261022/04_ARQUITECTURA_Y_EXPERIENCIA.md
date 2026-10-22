# Arquitectura y experiencia OBEY

Decisión propuesta: ampliar el monolito modular existente. Código común, un bot, puntos de entrada separables. No empezar con microservicios ni reemplazar Mongo, Express/EJS y BullMQ por moda. La estructura canónica sigue en ../GUIA_PARA_REORGANIZAR_OBEY.md y ../tecnologia/; este documento añade los límites para crecimiento, negocio e investigación.

## Cómo se organiza

| Ubicación objetivo | Responsable |
| --- | --- |
| src/entrypoints/bot.js | Componer Gateway, rutas de interacción y módulos habilitados |
| src/entrypoints/web.js | OAuth, panel, consultas y webhooks; no otra cola musical |
| src/entrypoints/worker.js | Jobs durables e idempotentes que ya tengan handler |
| src/modules/<modulo>/index.js | API pública del módulo y registro en el feature-registry existente |
| src/modules/<modulo>/application/ | Operaciones compartidas por Discord, web y trabajos |
| src/modules/<modulo>/domain/ | Estados e invariantes cuando hagan falta |
| src/modules/<modulo>/adapters/ | Parsear/presentar Discord y HTTP, sin duplicar negocio |
| src/shared/i18n, assets, authorization | Resolvedores y políticas compartidos |
| src/infrastructure/ | Mongo, Redis, jobs, proveedores y observabilidad |
| assets/obey/ | Originales, exports, manifests e IDs reales separados |
| docs/ | Guías de usuario, arquitectura, operaciones y decisiones |
| deploy/ | Perfiles de ejecución y procedimiento de migración comprobado |

No crear todas las carpetas vacías ni una clase para cada función. Migrar un recorrido completo en cada cambio y dejar compatibilidad de lectura durante la transición. CommonJS inicialmente; JSDoc/checkJs y contratos según el piloto existente. La conversión completa a TypeScript no bloquea reparar música.

## Contrato de una capacidad

Cada ficha declara dueño, configuración versionada, actor y guild autenticados, entradas, operación compartida, permisos, resultado, traducciones, recursos, datos, eventos, jobs, métricas y aceptación. Activar por guild exige que permisos/entitlements/recursos estén listos. Los módulos no se escriben mutuamente las colecciones; exponen consultas y operaciones públicas.

Resultados: confirmado, pendiente, parcial, desconocido, conflicto, denegado e inválido. Un ACK o una animación no acredita el efecto. operationId permite consultar el resultado tras reinicio. correlationId une diagnóstico sin incluir tokens o contenido privado innecesario.

## Recorridos esenciales

| Recorrido | Ruta completa | Criterio visible |
| --- | --- | --- |
| Configurar | elegir guild y módulo → usar existente/crear → preview → validar → publicar | muestra destino efectivo y recibo; borrador no cambia producción |
| Tickets | panel → formulario → canal/hilo → claim → conversación → cierre → transcripción | permisos del usuario y equipo; DM cerrado no pierde ticket |
| Moderación | objetivo → permiso/jerarquía → confirmación si procede → aplicar → caso → entrega | sanción y entrega son estados separados; actor desconocido se admite |
| Logs | evento accesible → diff → correlación → persistencia → entrega | todos los campos cambiados; huecos de captura visibles |
| Música | buscar → elegir → encolar → reproducir → fin → siguiente/autoplay | slash y botones consultan la misma revisión de sesión |
| Colecciones | ver → filtrar → ofrecer → confirmar por ambas partes → transferencia | inventario/saldo consistentes; expiración no transfiere nada |
| Premium | elegir alcance → comprar → pago confirmado → entitlement → función | cancelar renovación no revoca antes del fin pagado |

## Reglas de mensajes

Título orientado a la acción, resultado en primera línea, datos concretos, una acción principal y alternativas relevantes. Texto completo en locales; iconos por clave semántica. Errores explican cómo recuperarse sin mostrar stack o secretos. Menús largos usan paginación/selector; acciones peligrosas requieren identidad y estado actuales. Personalizar texto no concede permisos.

Estándar de controles: label siempre que el significado no sea inequívoco, estado deshabilitado cuando no aplica, caducidad clara y protección frente a clics repetidos. Cada botón revalida actor/guild/entidad/revisión. No depender de collectors en memoria para paneles persistentes.

Animaciones: estado idle estático; tras la interacción el servidor puede publicar una variante de proceso/resultado. Un GIF no se activa solo al pulsar un botón y no garantiza reiniciar o reproducirse en cada cliente. El resultado compartido lo verán todos; confirmaciones privadas no cambian ese hecho. Preferencia de movimiento reducido y fallback estático obligatorios en la propuesta.

## Convivencia

Asignar canales y roles por IDs seleccionados, con observe/cooperate/manage por capacidad. Compartir nombres no integra bases de otros bots. Mantener actor ejecutor y atribución textual separados, incluso al seguir la convención de razones de Quark. No deducir culpables de una invitación o un evento cercano sin suficiente evidencia.

## Dependencias

Discord.js es el adaptador principal. Instalar paquetes @discordjs solo si un consumidor real los usa y no conviene su reexport público; no instalarlos todos por pertenecer al ecosistema. Resolver Node>=22.12.0 exigido por voice del lock frente al engines actual >=20. La versión concreta de runtime/imagen/CI se fija al probar instalación limpia. lavalink-client requiere versión fijada, plugins compatibles, pruebas de fin/errores y ausencia de dos autoridades de avance.
