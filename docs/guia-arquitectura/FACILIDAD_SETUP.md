# Facilidad de uso de los setups

Continuación del plan del ZIP, priorizada por el usuario después del despliegue del 18/10/2026: los setups siguen siendo difíciles de entender y usar. Este trabajo corrige la interacción de los asistentes existentes; no crea comandos ni cambia su autorización o almacenamiento.

Problemas observados en el código actual: navegación por nombres de comandos sin explicar su finalidad; submenús sin orientación y sin regreso; mensajes nuevos al entrar en cada sección; formularios que muestran valores técnicos y no indican el siguiente paso; tickets comienza ofreciendo 100 sistemas; opciones técnicas compiten con las necesarias para empezar.

## Entregas y aceptación

1. Inicio comprensible: nombres y finalidad de todas las configuraciones existentes en es/en, accesos a lo habitual y categorías explicadas. Conservar filtrado de permisos, registro vivo, cooldown y paginación. Comprobar con builders reales, navegación simulada y los tests originales.
2. Formularios orientados: instrucciones por tipo, estado legible de canales/roles, avance entre ajustes y regreso por el mismo mensaje. Conservar borrador, validación, CAS, autorización fresca, cierre y límites Discord. Comprobar sesiones y formularios con interacciones controladas, incluidos permisos revocados y conflictos.
3. Inicio sencillo de bienvenida y tickets: explicar el resultado, dar una ruta básica y separar opciones avanzadas; mantener acceso a los sistemas existentes. Conservar publicación explícita y recursos actuales. Comprobar que abrir/navegar nunca guarde ni publique, y que el guardado mantenga los campos ocultos.

Cada entrega debe registrar resultado y límites antes de marcarla terminada. Las verificaciones nuevas serán temporales y se retirarán al terminar, manteniendo los tres archivos/25 tests originales. No usar datos de usuarios para comprobar la navegación. El plan de arquitectura general continúa abierto.

## Primera entrega local · navegación

El inicio ofrece bienvenida, tickets, reproductor, idioma y registros cuando están disponibles para el actor. Cada una de las 61 configuraciones prefix distintas tiene nombre y finalidad es/en; los IDs internos y nombres de comandos se conservan. Las categorías explican su contenido. 32 grupos de builders reales cubren ambos idiomas, opciones ausentes, contexto vacío y 60 entradas paginadas. La comprobación previa reprodujo la ausencia de accesos directos y las etiquetas técnicas. No se ha desplegado esta entrega.
