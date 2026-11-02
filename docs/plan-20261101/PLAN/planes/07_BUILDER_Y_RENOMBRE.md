# OBEY Builder · Constructor de servidores

**Nombre en navegación:** Constructor. **Marca del módulo:** OBEY Builder. **Carpeta final:** `bot/modulos/builder/`. **Slash objetivo:** `/builder` (no registrar hasta conciliar nombres existentes). **Tipo:** construcción y remodelación de servidores Discord, inspirado funcionalmente en Server Maker, sin copiar su marca ni implementación.

No es solamente edición de apariencia: incluye estructura de canales, categorías, roles, permisos, plantillas, importación/exportación, borradores, vistas previas, cambios y respaldos. Nunca se aplicarán cambios destructivos por mostrar un diseño.

## Nombres de archivos propuestos

```text
bot/modulos/builder/
├── index.js
├── comandos/
│   ├── builder.js
│   ├── crear.js
│   ├── editar.js
│   ├── clonar.js
│   ├── plantillas.js
│   └── copias.js
├── servicios/
│   ├── estructura.js
│   ├── plantillas.js
│   ├── permisos.js
│   ├── simular.js
│   ├── aplicar.js
│   └── recuperar.js
├── eventos/
│   └── progreso.js
├── vistas/
│   ├── inicio.js
│   ├── editor.js
│   ├── revision.js
│   └── resultado.js
└── datos/
    ├── borradores.js
    ├── plantillas.js
    └── copias.js
```

La web utiliza `app/app/[servidor]/builder/page.tsx`, un editor React interactivo y servicios tipados que llaman al MISMO servicio de dominio. Nunca cargar `handlers/architect` dentro del navegador.

## Flujos funcionales

1. **Crear desde plantilla:** biblioteca -> personalizar -> previsualizar -> validar permisos -> copia previa (si hay contenido existente) -> confirmación -> aplicación -> conciliación.
2. **Editar servidor existente:** snapshot reciente -> edición guiada -> diferencias -> verificar drift, rol del bot y permisos -> confirmar -> aplicación supervisada -> registro y recuperación.
3. **Clonar estructura:** origen autorizado -> vista previa -> selección específica de categorías/canales/roles -> gestionar elementos no clonables y referencias -> confirmar sin datos privados.
4. **Builder asistido (opcional):** convertir texto en propuesta editable, NUNCA en efectos directos. Reglas, límite de cambios y aprobación explícita.
5. **Plantillas y copias:** versiones, propiedad, permisos, importación validada, restauración que advierte diferencias.

## Mapeo desde el código anterior (pendiente de ejecución)

| Actual | Destino previsto |
|---|---|
| `handlers/architect/service.js` | `bot/modulos/builder/servicios/estructura.js` y fachada de coordinación |
| `handlers/architect/blueprint.js` | `bot/modulos/builder/servicios/estructura.js` |
| `handlers/architect/preflight.js` | `bot/modulos/builder/servicios/simular.js` |
| `handlers/architect/permissions.js` | `bot/modulos/builder/servicios/permisos.js` |
| `handlers/architect/restore-points.js` | `bot/modulos/builder/servicios/recuperar.js` |
| `handlers/architect/wizard.js` | `bot/modulos/builder/servicios/plantillas.js` |
| `dashboard/architect-routes.js` | adaptador API del Builder con validación y permisos |
| `dashboard/views/pages/architect.ejs` | `web/app/app/[servidor]/builder/page.tsx` |
| `dashboard/public/js/architect-*.js` | componentes y hooks React del editor (sin copia literal de DOM imperativo) |
| `/architect/:guildId` y `/api/architect/:guildId` | redirección/compatibilidad limitada, migración progresiva a `/app/:id/builder` y servicios API |

**No renombrar a ciegas** las colecciones Mongo, claves históricas, custom IDs o rutas OAuth. Si hace falta mantener compatibilidad, dejar alias temporal documentado hasta migrar clientes y pruebas. Retirar tras comprobación. **No se ha ejecutado esta migración.**

## Pruebas obligatorias

- Servidor sin permiso, bot debajo del rol objetivo, desaparición de canal/rol, categoría heredada, cambios simultáneos.
- Borrador publicado desde dos pestañas y revisión stale.
- Copia previa, reversión que puede fallar parcialmente, aplicación que reporta hechos confirmados.
- Accesibilidad teclado/táctil y revisión en móviles; texto largo, rol/IDs, estructuras de más de 500 entradas.
- Cada acción peligrosa requiere revisión de diferencias, identidad de servidor, tipo de operación y confirmación explícita.


## Matriz de renombrado adicional

| Nombre de antes | Nombre aprobado para el plan |
|---|---|
| Arquitecto / Architect / Server Architect (UI) | Constructor / OBEY Builder |
| `bot/modulos/arquitecto/` | `bot/modulos/builder/` |
| `/architect/:guildId` | `/app/:guildId/builder` cuando se migre |
| `dashboard/architect-routes.js` | `dashboard/builder-routes.js` o ruta equivalente Next, al migrar |
| `handlers/architect/*` | `bot/modulos/builder/servicios/*` (por comportamiento) |
| CSS/JS architect históricos | Componentes React bajo `web/componentes/builder/` |

No renombrar directamente claves guardadas en DB ni contratos remotos sin adaptadores y migración probada.
