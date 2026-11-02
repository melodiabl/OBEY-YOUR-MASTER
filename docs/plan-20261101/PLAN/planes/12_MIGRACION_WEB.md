# 12 · Migración web por etapas, sin tocar landing

## P0 · Diseño, inventario y contratos
- Congelar rutas y tokens CSS existentes. No cambiar la landing.
- Mapear rutas EJS, Next y Express, incluyendo Architect, OAuth, páginas de música, tickets, logs y configuración.
- Inventariar permisos, sesiones, listeners, jobs, bases de datos, fuentes de verdad y controles de bot.
- Aprobar el alcance de Builder, navegación y animaciones.

## P1 · Interfaz Next
- Crear shell autenticado `web/app/(panel)/panel` y pantallas con componentes reutilizables TSX.
- Mantener URLs antiguas mediante rutas/redirecciones verificadas, no romper `/app` a ciegas.
- Reconstruir Builder y música con API del backend actual, sin funcionalidades falsas.
- Controlar cambios no guardados, navegación por teclado, móvil y estados de red.

## P2 · APIs/servicios
- Migrar contratos desde Express sin duplicación de lógica.
- Conectar estado musical canónico después de la migración lavalink-client del bot.
- Reconciliar real-time, cookies, CSRF y OAuth bajo proxy/nginx.
- Solo si se cambia a Next Node, añadir BFF `app/api/` y retestar sesiones e infraestructura.

## P3 · Retirar legado
- Migrar flujos faltantes con tests end-to-end en servidores de prueba.
- Comparar contrato viejo/nuevo, actualizar importaciones y redirecciones.
- Eliminar páginas EJS y scripts `architect-*.js` **solo cuando** los reemplazos cubran las funciones existentes.
- Mantener rollback comprobado. Evitar un salto con reemplazo total sin pruebas.

## Criterios de aceptación

- Landing idéntica y sin nuevas dependencias visuales.
- Paleta web actual exacta, sin colores obligatorios del personaje.
- Next compila con Node compatible, HTML responsivo y WCAG AA objetivo.
- Navegación usable con teclado y lector de pantalla; `prefers-reduced-motion` funcional.
- OAuth/cookies/CSRF/pérdida de permisos y cambio de servidor probados.
- Builder: diff, respaldo, permiso, confirmación, conflicto, rollback e idempotencia.
- Música: una sola fuente de estado, sin doble cola ni falsas confirmaciones.
- Flujos y rutas del backend con tests; no exponer interfaces de módulos no implementados.
- Ningún cambio se despliega ni se publica sin autorización explícita.
