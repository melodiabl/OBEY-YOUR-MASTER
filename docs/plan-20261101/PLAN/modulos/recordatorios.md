# Recordatorios · Plan de migración (reminders)

**Estado:** PENDIENTE — requiere auditar consumidor, estado y persistencia. Esta ficha es planificación, no código implementado.

**Fuente de partida:** `docs/guia-arquitectura/modulos/reminders.md` dentro de `OBEY_Implementacion_con_Guia.zip`.

**Ruta final propuesta:** `bot/modulos/recordatorios/`.

## Archivos propuestos

- `index.js`: declara dependencias, comandos, interacciones y configuración de este módulo.
- `comandos/`: `recordar, listar, cancelar`.
- `servicios/`: `crear, programar, cancelar`.
- `vistas/`: `nuevo, programado, entregado, error`.
- `datos/`: persistencia y consultas existentes — no duplicar modelos ni alterar esquema sin migración.

## Interfaz de Discord

Representar como mínimo **inicio**, **pendiente**, **resultado correcto** y **error**, además de vacío/caducado/sin permisos cuando apliquen. Los botones deben llamar a un servicio y verificar su respuesta, nunca confirmar antes de tiempo. Asegurar ES/EN y configuración por servidor.

## Trabajo de implementación

1. Localizar comandos reales y consumidores existentes en `commands/`, `slashCommands/`, `handlers/` y web; documentar su firma y datos antes de mover nada.
2. Escribir pruebas de comportamiento sobre la base actual; incluir permisos, concurrencia, reinicio, reintentos y datos existentes.
3. Migrar operaciones y servicios al nuevo módulo, mantener contratos de datos y transformar todas las rutas/imports.
4. Conectar slash, prefijo, botones y web al **mismo** servicio; comprobar paridad de respuesta.
5. Reconciliar el registro único de emojis y traducciones; preferencia A aprobada para usos existentes. B requiere aprobación.
6. Eliminar archivos anteriores **solo** cuando no queden consumidores y pasen pruebas de aceptación.

## Criterios de aceptación

- Paridad de funciones auditadas y datos, sin comandos duplicados.
- Gestión de errores y permisos verificable con usuario autorizado/no autorizado.
- Al menos un recorrido feliz y uno fallido probado en un servidor de prueba.
- Vista de escritorio/móvil revisada y accesible; pruebas de estados reales.
- Evidencia adjunta (SHA, pruebas, captura, commit cuando esté autorizado).
