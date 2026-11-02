# 04 · Rediseño interno React/Next — documento de referencia

> **Actualización vigente:** consultar `09_WEB_ARQUITECTURA_DETALLADA.md`, `10_ANIMACIONES_Y_ESTADOS.md`, `11_APIS_Y_SEGURIDAD.md` y `12_MIGRACION_WEB.md` como decisiones más recientes. Los ejemplos antiguos no acreditan funciones implementadas.

# 04 · Rediseño del panel interno React + Next.js

## Alcance confirmado

**No tocar la landing pública actual.** Renovar exclusivamente el área autenticada `/app`, conservando los accesos públicos y los contratos OAuth existentes. Evitar cualquier pack de ilustraciones, GIF o emojis para la web: interfaz mediante componentes React, CSS y API propias; las piezas del bot en Discord permanecen en su catálogo.

## Base comprobada en GitHub (01/11/2026)

- `dashboard/frontend/package.json`: Next 16.4.3, React 19.3.1.
- `dashboard/frontend/components/dashboard.tsx`: aplicación actual con `overview`, `configuration`, `welcome`, `library` dentro de un componente cliente.
- `dashboard/frontend/components/music-panel.tsx`: estado musical cliente existente.
- `dashboard/architect-routes.js` y `handlers/architect/`: motor histórico existente de propuestas/diff/aplicación.
- `dashboard/views/pages/architect.ejs` y `dashboard/public/js/architect-*.js`: frontend anterior de la herramienta actualmente llamada Architect.

**Observación:** la web Next y la web EJS coexisten en el repositorio. El plan debe migrarlas por dominios sin duplicar permisos, contratos o escrituras.

## Navegación rediseñada

**Principal:** Inicio/Resumen, Builder (Constructor), Música, Moderación, Seguridad, Registros, Tickets, Comunidad, Automatizaciones, Estadísticas, Configuración.

**Subsecciones:** Comunidad → Bienvenida, Roles, Niveles, Verificación, Sugerencias, Eventos; Moderación → Casos, AutoMod, Acciones, Historial; Builder → Biblioteca de plantillas, Editor, Simulación, Respaldos, Historial; Configuración → Preferencias, Idiomas, Permisos, Integraciones, Plan.

No meter 32 enlaces en la barra lateral. La configuración contextual por servidor agrupa las capacidades y expone enlaces reales sin fingir que todas las 32 están listas.

## Diseño de pantalla

- Encabezado: servidor activo, ámbito, conexión, búsqueda global, soporte, perfil.
- Barra lateral: áreas principales con sección activa y contador de alertas solamente con datos reales.
- Área de trabajo: título, descripción, breadcrumb, acciones primarias, pestañas y contenido.
- Editor: estructura izquierda, canvas central, inspector de propiedades y permisos a la derecha; pasos revisar/confirmar; mobile con paneles desplegables, no columnas estrechas.
- Estados necesarios: cargando, vacío, sin permiso, sin conexión, error, cambios sin guardar, conflicto, revisión obsoleta, publicación confirmada.
- Borradores y deshacer: guardar local de UI no equivale a guardar servidor; persistir con revisión/CAS, e informar el resultado.

## Qué agregamos (prioridades)

| Prioridad | Función | Valor | Restricción |
|---|---|---|---|
| P0 | Navegación por servidor y permisos | Claridad y seguridad | Mantener sesión OAuth y permisos frescos |
| P0 | Builder: simulación/diff y copia previa | Evitar pérdidas | No aplicar sin confirmación y comprobación |
| P0 | Configuración por módulo + búsqueda | Escalabilidad de UX | No prometer módulos incompletos |
| P1 | Centro de actividad y cambios | Trazabilidad | Redactar datos sensibles |
| P1 | Biblioteca de plantillas Builder | Configuración rápida | Versiones, propiedad, validación y permisos |
| P1 | Panel musical en vivo | Uso conectado al bot | Una sola autoridad `lavalink-client` |
| P1 | Tickets y registros explorables | Operación centralizada | Control de roles/tenant |
| P2 | Asistente de Builder con IA | Crear propuestas desde texto | IA no ejecuta cambios sin revisión |
| P2 | Automatizaciones guiadas | Operación recurrente | Límite, auditoría, pausa |
| P2 | Comparador de configuración | Diagnóstico y restauración | Resultados parciales y drift |

## Next.js App Router propuesto

```text
web/
├── app/
│   ├── layout.tsx                   # Convención obligatoria de Next
│   ├── (panel)/
│   │   └── app/
│   │       ├── layout.tsx           # Shell autenticado del panel
│   │       ├── page.tsx             # Mis servidores
│   │       └── [servidor]/
│   │           ├── layout.tsx       # Contexto y permisos del servidor
│   │           ├── page.tsx         # Resumen
│   │           ├── builder/
│   │           │   ├── page.tsx
│   │           │   └── loading.tsx
│   │           ├── musica/page.tsx
│   │           ├── moderacion/page.tsx
│   │           ├── seguridad/page.tsx
│   │           ├── registros/page.tsx
│   │           ├── tickets/page.tsx
│   │           ├── comunidad/page.tsx
│   │           ├── automatizaciones/page.tsx
│   │           ├── estadisticas/page.tsx
│   │           └── ajustes/page.tsx
│   ├── error.tsx
│   └── not-found.tsx
├── componentes/
│   ├── panel/
│   │   ├── barra-lateral.tsx
│   │   ├── cabecera.tsx
│   │   ├── selector-servidor.tsx
│   │   └── buscador.tsx
│   ├── builder/
│   │   ├── editor.tsx
│   │   ├── arbol.tsx
│   │   ├── inspector.tsx
│   │   ├── plantillas.tsx
│   │   └── revisar.tsx
│   └── ui/
│       ├── boton.tsx
│       ├── tabla.tsx
│       ├── formulario.tsx
│       ├── modal.tsx
│       └── estado.tsx
├── servicios/
│   ├── servidor.ts
│   ├── builder.ts
│   ├── musica.ts
│   ├── tickets.ts
│   └── permisos.ts
├── contratos/
│   └── builder.ts
├── hooks/
│   ├── use-builder.ts
│   └── use-musica.ts
├── estilos/
│   └── tokens.css
└── pruebas/
    ├── panel.test.ts
    ├── builder.test.ts
    └── permisos.test.ts
```

La landing existente se conserva fuera del ámbito de estas rutas. En Next.js `page.tsx`, `layout.tsx`, `loading.tsx` y `error.tsx` son nombres de convención que no se renombran por preferencia estética.

## Seguridad y aceptación

Server Components para lecturas autorizadas, Client Components para editores. La UI jamás decide permiso final. Mantener sesión/cookies, CSRF, verificación fresca, ownership, aislamiento tenant, validadores, idempotencia, manejo de conflictos, backup, registro y reversión. La web NO crea segunda conexión Lavalink/cola musical.

Antes de reemplazar la vista EJS, probar paridad de API, resguardo de borradores, acceso real, formularios, mobile, lector de pantalla, operaciones con servidor de pruebas, errores parciales y rollback. No afirmar que la maqueta ha pasado esas pruebas.

Fuentes: https://nextjs.org/docs/app/getting-started/layouts-and-pages ; https://nextjs.org/docs/app/getting-started/server-and-client-components ; https://discord.com/discovery/applications/1233001713242476678
