# Modularidad y tecnologías para OBEY

Decisión de diseño propuesta, ampliada el 17/10/2026. Esta carpeta guía una implementación futura. No instala paquetes, cambia código del bot ni certifica funciones nuevas.

El objetivo es que una persona pueda localizar una función, modificarla y comprobar sus efectos sin conocer todo OBEY; y que un administrador pueda configurar su servidor sin editar archivos. Son dos experiencias distintas y ambas forman parte del diseño.

## Decisiones concretas

1. Mantener un proyecto y un bot, con módulos por capacidad y un núcleo pequeño. Conservar el registro existente y ampliarlo gradualmente.
2. Incorporar Zod 4 en el piloto para los contratos nuevos, con JSON Schema generado para describir campos. Usar TypeScript primero para comprobar JavaScript seleccionado mediante JSDoc; decidir la compilación de `.ts` después del piloto.
3. Mantener Express/EJS, Mongo/Mongoose, Socket.IO, BullMQ, discord.js y los renderers actuales. El destino de audio confirmado es lavalink-client; Shoukaku se conserva solo como adaptador legacy durante la transición. Ver ../sistema/07_MUSICA_LAVALINK_CLIENT.md.
4. Definir una descripción de formulario por módulo y componentes EJS reutilizables. La validación de recursos y permisos permanece en servidor.
5. Añadir control de dependencias con dependency-cruiser para los módulos migrados. No convertir todos los incumplimientos legacy en bloqueantes desde el primer día.
6. Ofrecer borradores, vista previa, publicación, conflictos y diagnóstico en cada capacidad que los necesite. Extender el patrón existente de bienvenida.
7. Separar disponibilidad del proceso, activación por servidor, permisos y salud de proveedores. Un único booleano no representa estos estados.
8. Hacer que configuración, textos, traducciones, recursos y reglas de negocio tengan lugares explícitos de edición.

[Inferencia] Estas decisiones pueden reducir cambios repetidos y errores entre entradas; el beneficio debe comprobarse con el piloto, no darse por obtenido al instalar librerías.

## Orden de lectura

| Documento | Resultado que debe producir Codex |
| --- | --- |
| [Base real](08_BASE_REAL_Y_DIFERENCIAS.md) | Conciliación del paquete y la rama |
| [Stack elegido](01_STACK_Y_DECISIONES.md) | Dependencias justificadas y adopción gradual |
| [Contrato del módulo](02_CONTRATO_DEL_MODULO.md) | API pública, composición y ciclo de vida |
| [Configuración y panel](03_CONFIGURACION_Y_PANEL.md) | Campos editables y flujo de configuración |
| [Tipos y límites](04_TIPOS_Y_DEPENDENCIAS.md) | Reglas comprobables entre módulos |
| [Cómo editar](05_COMO_EDITAR_Y_EXTENDER.md) | Procedimiento para cambios cotidianos |
| [Plan de adopción](06_PLAN_DE_ADOPCION.md) | Ocho incrementos verificables |
| [Operación](09_OPERACION_Y_RECUPERACION.md) | Salud, recuperación y servicios opcionales |
| [Fuentes](07_FUENTES_Y_ALCANCE.md) | Soporte técnico y límites de la investigación |

Esta ampliación concreta la decisión tecnológica que la guía principal dejaba abierta. Sus ejemplos son especificaciones, no archivos ejecutables instalados. Las 32 fichas originales conservan su alcance y sus pendientes. No se agregan comandos, emojis ni dominios futuros por definir tecnologías.

## Cómo evaluar que sea fácil

- Añadir un campo: modificar su contrato, descriptor de pantalla y traducciones; no duplicar la regla de validación en cada entrada.
- Cambiar un texto: localizar la clave de traducción; no tocar el algoritmo del módulo.
- Cambiar un proveedor: implementar su puerto y elegirlo en composición; no cambiar comandos y pantallas.
- Desactivar una función: guardar la decisión del servidor y aplicar su política de drenaje; no borrar carpetas o comandos globales.
- Detectar un fallo: obtener código, operación, capacidad afectada y acción recuperable; no buscar tokens en logs.

Estos son criterios de aceptación propuestos. Registrar qué archivos y pasos exigió realmente el piloto; si un cambio obliga a editar múltiples validadores o rutas equivalentes, la extracción sigue incompleta.
