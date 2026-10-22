> Estado vigente del checkout: [conciliación 0.15 y prioridades](CONCILIACION_2026-10-23.md). Se preservan los avances y el runtime `07da107`; los informes de base conservan su fecha y alcance.

> Actualización vigente 0.6: [catálogo de eventos](sistema/15_CATALOGO_EVENTOS.md) integrado en assets/obey/catalog-eventos/. Escenas y seis GIF se conservan. Los antiguos 24 iconos de registros se retiraron; runtime y publicación Discord siguen pendientes.

> Edición vigente 0.4: empezar por [sistema/00_INDICE.md](sistema/00_INDICE.md). El destino musical es lavalink-client. Las fichas de esta carpeta se ampliaron en su ubicación. Los documentos de evidencia conservan su contexto histórico y no acreditan implementación nueva.

# Documentación para reorganizar OBEY

Esta carpeta contiene instrucciones y contratos para guiar a Codex sobre la rama de implementación. El proyecto está en la raíz del paquete conjunto. La guía no acredita una migración ya aplicada. Para el alcance del código incluido, leer ../../LEER_PRIMERO.md.

0. Leer [tecnología y modularidad](tecnologia/00_LEER_PRIMERO.md), que concreta contratos, formularios, tipos y reglas de dependencias antes de implementar.
1. Leer GUIA_PARA_REORGANIZAR_OBEY.md para la arquitectura y las reglas de migración.
2. Leer MATRIZ_DE_CONCILIACION.md y verificar la rama actual frente al SHA de EVIDENCIA_BASE.md.
3. Ejecutar por capacidades el orden de PLAN_POR_ETAPAS.md y registrar estado en PLAN_POR_ETAPAS.md.
4. Consultar la ficha de cada módulo en modulos antes de reorganizar sus entradas y datos.
5. Entregar a Codex INSTRUCCIONES_PARA_CODEX.md junto con el acceso al repositorio.

La guía usa como referencia remota c8ba6d3. El refactor local 887bb6e y los ZIP de código posteriores no se consideran una implementación aceptada ni una base que deba imponerse al proyecto. Si ya se aplicaron, Codex debe conciliarlos explícitamente.

Las 32 fichas describen objetivos y 128 casos escritos; no acreditan que todos los módulos existan o funcionen. Los módulos sin núcleo confirmado permanecen diferidos. Las propuestas opcionales del capítulo 24 anterior no forman parte de una orden automática de crear comandos.

## Formato de trabajo

Todos los archivos de esta carpeta de guía son Markdown. Mantener estados por tarea y completar evidencia en la misma ficha, con commit y resultado. No copiar una lista de pendientes a otro plan sin actualizar su fuente; las 12 tareas transversales y las 32 fichas comparten los mismos IDs.

## Ampliación de tecnologías

La guía contiene ahora 51 Markdown: los 40 documentos base, 10 capítulos de tecnología/modularidad y una investigación musical. El código del paquete conjunto se conserva sin cambios en esta ampliación. Las decisiones tecnológicas son propuestas para ejecutar por capacidad, no dependencias instaladas. Ver [base real y diferencias](tecnologia/08_BASE_REAL_Y_DIFERENCIAS.md) y [plan de adopción](tecnologia/06_PLAN_DE_ADOPCION.md).

## Música y respuesta de controles

La [investigación de rendimiento](MUSICA_RENDIMIENTO_Y_LATENCIA.md) compara fuentes y código de bots musicales, identifica el bucle independiente de letras de OBEY y propone coordinación de publicaciones, perfiles de nodo y mediciones. No modifica el audio ni los controles del paquete.

## Estado de ejecución en este checkout

La guía base de 51 Markdown se incorporó en a05036a. Leer primero [conciliación](CONCILIACION_2026-10-18.md), [piloto local de bienvenida](PILOTO_BIENVENIDA.md) y los estados actualizados de PLAN_POR_ETAPAS.md. La carpeta de código del ZIP permanece separada y su refactor bootstrap no se aplicó. El piloto `3d63780c30da9fab6546d899af21fc2c072d3016` es trabajo local, sin publicación remota ni despliegue.

Continuación TECH-04: [formulario de bienvenida](FORMULARIO_BIENVENIDA.md), commit `c627d2f3a3ed5a6da76c65e58cb67739a13f7589`, verificado en navegador aislado. Publicación y despliegue siguen separados.

Último incremento local TECH-05 parcial: [cierre de configuración de bienvenida](CICLO_DE_VIDA_BIENVENIDA.md), commit `0771a47953a17cbac9f4d853554fd0ecb274d45f`. Espera operaciones aceptadas antes del flush y rechaza nuevas entradas. ARCH-04/TECH-05 globales siguen pendientes; sin despliegue.

Continuación TECH-06 parcial: [API y límites comprobables de bienvenida](API_BIENVENIDA.md), commit `ddc4ec433252fefc68ce41e10329a7a64e47a80f`. Entrada pública explícita, imports/tipos en CI y cinco rutas documentadas con comportamiento HTTP/Mongo local comprobado. La API avanzada y las dependencias globales del plan siguen abiertas; no se ha publicado ni desplegado.

Prioridad posterior indicada por el usuario: [remodelación de los 63 setups](REMODELACION_SETUPS.md), código y menús de Discord juntos. Navegación `setup` implementada y comprobada localmente en `eadc547b0684ded2c9cca65cc685362c518ab660`; los asistentes individuales conservan sus tareas pendientes.

Continuación de setups: [idioma y guardado confirmado](IDIOMA_SETUP.md) en `f4163778677b3b893bde2308c1a328e8d24111e5`. Dos de 63 entradas remodeladas localmente; quedan 61 y sigue setup-embed. El candidato Lavalink aportado se comprobó aparte en [HeavenCloud](../platform/HEAVENCLOUD-2026-10-18.md) sin modificar el principal o respaldos.

## Estado vigente después del despliegue

Los 63 setups están remodelados y desplegados en `f4acfac` (18/10/2026). El usuario priorizó después su facilidad de uso: continuar por [FACILIDAD_SETUP.md](FACILIDAD_SETUP.md), con una sola entrada `!setup` y recorrido por el mismo mensaje. Los incrementos descritos arriba son históricos; no implican que sigan pendientes 61 comandos. El plan global de arquitectura conserva sus tareas abiertas.

## Actualización 0.7 · materiales y mapa de consumidores

La entrega incorpora las doce familias A aprobadas, la extensión B01–B65, propuestas de plataformas, galería y deltas ES/EN. Leer [índice del sistema](sistema/00_INDICE.md), en especial los capítulos 16–19, y el mapa de [reemplazos CSV](auditoria-recursos/replacements.csv). Los 32 módulos tienen referencias de materiales actualizadas. El inventario estático y los hallazgos distinguen datos, lógica y presentación. No acreditar conexiones runtime, pruebas Discord, publicación o migración musical a partir de estos archivos.
