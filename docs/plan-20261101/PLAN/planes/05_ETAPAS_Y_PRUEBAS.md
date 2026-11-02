# 05 · Etapas, validación y condiciones de aceptación

## Gate 0 — Congelar línea base (sin tocar producción)

Verificar el último commit remoto y la versión efectiva desplegada. Comparar plan y ZIP histórico (`SHA-256` anotado en README), inventariar comandos, rutas web, tareas, recursos, estados DB, dependencias dinámicas y pruebas. No restaurar ficheros viejos sobre avances actuales. Acordar lista de capacidades y condiciones de aceptación por módulo.

## Gate 1 — Contratos y arquitectura

Escribir interfaces reales, pruebas actuales y límites: configuración, permisos, estados, i18n, carga de comandos, registro de recursos. Dejar estructuras propuestas como especificación, no duplicar procesos ni rutas temporales sin corte documentado.

## Gate 2 — Música

Migrar Shoukaku → `lavalink-client` por un solo dueño de cola, usando canary, auto-recuperación probada, rollback. No instalar motores simultáneos con las mismas sesiones de guild.

## Gate 3 — Módulos

Migrar las 32 fichas por prioridad y dependencia. `collections`, `events`, `starboard` y `verification` están diferidos según el ZIP base por ausencia de dominio confirmado; auditar antes de prometer implementación. Por cada módulo: tests en rojo sobre base, mover servicio, actualizar consumidores, registrar evidencias, retirar legacy.

## Gate 4 — Discord UX/UI

Implementar/renderizar en discord.js la galería acordada, validación de interacciones, modos de accesibilidad, estados de errores. Publicar emojis solamente después de aprobación y generar IDs desde Discord; no fingir recursos instalados.

## Gate 5 — Web

Migración a React + Next.js App Router: rutas, layouts, componentes, server/client boundaries, API/OAuth/sesiones y dashboard completo. Reusar servicios, permisos y datos reales del bot; sin crear materiales gráficos específicos para la web ni duplicar la biblioteca de emojis/GIF de Discord. No reabrir P0 remoto ya cerrado sin motivo.

## Gate 6 — Calidad y publicación

CI limpias, test de integración con Discord/nodos reales en guild autorizada, checklist de 32 módulos, documentación, rollback probado, observabilidad y soporte. Eliminar rutas antiguas **solo** cuando los tests demuestren sustitución.

## Definición de terminado

- Ningún comando funcional anterior desapareció accidentalmente.
- Todos los modules prometidos tienen dueño, tests y estado visible.
- Audio con `lavalink-client` exclusivo, nodo validado y sesiones/reanudar evaluadas.
- Web y Discord consistentes con mismo dominio y permisos.
- A/B visual aprobado, fuentes verificadas, idiomas ES/EN probados.
- Code review, pruebas de regressión, despliegue controlado y reversión disponible.

**Esta entrega solo documenta gates; no los da por aprobados.**
