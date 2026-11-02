# 10 · Sistema de animaciones y estados reales

## Principios

La web conserva sus colores; la animación es una capa de interacción, no una identidad cromática nueva. Usar Motion para React para transiciones entre vistas, paneles, reordenamientos y entrada/salida, más CSS nativo para estados simples. No usar GIF como sustituto de una transición de interfaz.

| Elemento | Animación objetivo | Duración propuesta | Resultado accesible |
|---|---|---:|---|
| Navegación | Indicador deslizante con `layoutId` | 170–230 ms | Página activa con `aria-current` |
| Entrada de pantalla | Opacidad + desplazamiento vertical 6 px | 180–240 ms | Sin bloquear contenido |
| Sidebar | Deslizamiento lateral + overlay | 180–250 ms | Foco controlado; Escape cierra |
| Tarjeta | Cambio leve de elevación al hover | 120–170 ms | No movimiento continuo |
| Modal | Fade + escala 0.985 | 180–220 ms | Foco dentro; salida restaurada |
| Builder | Animación de reordenamiento del árbol `layout` | 200–300 ms | Confirmar cambios con diff real |
| Guardado | Estado pendiente → confirmación/error | condicionado a API | No confirmar hasta recibir OK |
| Notificación | Deslizar + aparecer | 180–260 ms | `role=status/alert` apropiado |
| Datos en vivo | Barras/indicadores solo si cambia dato real | 120–260 ms | Texto de estado disponible |
| Skeleton | Pulso sutil | 1100–1400 ms | Desactivado con menos movimiento |

## Motion

- `motion/react` solo en componentes cliente (`'use client'`).
- `AnimatePresence` para montajes/desmontajes; `layout` / `layoutId` para layout compartido.
- Transiciones rápidas e interrumpibles. No animar ancho/alto de listas grandes por JS si CSS transforms resuelven el caso.
- `useReducedMotion()` o `@media (prefers-reduced-motion: reduce)`; en modo reducido usar transición instantánea o solo opacidad breve.
- Respetar performance: `transform` y `opacity`; evitar onScroll complejo; virtualizar tablas y logs grandes; no repetir animaciones al actualizar el estado de un formulario.

## Estados funcionales obligatorios

`cargando`, `vacio`, `sin_permiso`, `sin_conexion`, `error`, `edicion_sin_guardar`, `conflicto`, `confirmado`, `parcial`, `caducado`. Cada uno exige texto específico y acción recuperable. Los cambios pendientes de Builder no se anuncian como aplicados; el reproductor no declara «reproduciendo» sin estado del backend.

## Propuesta visual

Abrir `previsualizaciones/OBEY_PANEL_ACTUALIZADO.html`; demostración autónoma, sin React/Next de producción, con estados simulados.
