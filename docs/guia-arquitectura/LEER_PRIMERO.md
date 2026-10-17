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
