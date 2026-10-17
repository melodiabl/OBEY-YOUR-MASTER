# Conciliación de la entrega · 18 de octubre de 2026

## ARCH-01 · base comprobada

Rama local y remota `feature/obey-main-implementation`: `c8ba6d3ee86515813e68a028e1221d093301e91b`, consulta Git del 18/10/2026. Árbol limpio antes de incorporar esta guía. Los 251 hashes de EVIDENCIA_BASE.md coinciden con el checkout.

Paquete recibido `OBEY_Implementacion_con_Guia (1).zip`, SHA256 `55b557df343ab84c7322c9e1bba13aafa5a856e0d5c77ca7a7f2287b99700bf4`. Extraído separadamente en `/home/OBEY_Implementacion`; CRC, tamaños y hashes de los 2713 archivos comprobados; los 2659 hashes de ENTREGA.json coinciden. ZIP eliminado después de verificar. El paquete no contiene historial Git, dependencias instaladas ni configuración privada de ejecución.

La rama tiene 2650 archivos versionados. No falta ninguno en el paquete. Diez archivos difieren: siete JSON de botconfig, index.js, dashboard/index.js y docs/platform/HANDOFF.md. Hay 63 archivos adicionales: ocho bootstrap, dos entradas de lectura, ENTREGA.json, ARCHITECTURE.md y 51 Markdown de la guía. Los JSON sanitizados no sustituyen la configuración vigente. Se incorporan los 51 Markdown como especificación; el código del ZIP se conserva aparte para revisión.

## Refactor local propuesto · 887bb6e

Revisión estática de bootstrap/application.js, shutdown.js, handlers.js, dashboard.js, index.js y el diff de dashboard/index.js. No aplicado automáticamente.

- Propuesta útil: separación de composición, validación antes de conexiones y cleanup que intenta todos los pasos. Mantiene la lista de handlers, el motor musical y sus IDs.
- Cambio de conducta: pasa de iniciar Mongo y Gateway en paralelo a esperar Mongo y los inicializadores del núcleo antes del login. Falta demostrar fallo/orden de arranque con los inicializadores reales, no solo dobles aislados. loaddb instala stores antes de esperar ready; preload y reconciliación se completan después y emiten dbReady.
- Defecto a corregir antes de adoptar: dashboard.stop usa `Promise.resolve().then(() => io?.close())`; Socket.IO devuelve el servidor y termina mediante callback. Ese Promise no acredita que se haya cerrado el servidor HTTP antes de continuar con el store. Deben probarse cierre efectivo, fallo parcial y solicitudes en curso.
- Cobertura pendiente: interrupción mientras Mongo conecta o dashboard inicia, cleanup de listeners legacy y deadline global con recursos reales aislados. Las 15 comprobaciones declaradas por el paquete son evidencia de su autor, no una ejecución de esta entrega.

La separación se evaluará en ARCH-04 después de fijar contratos. No se incorpora un nuevo orden de arranque para cumplir un árbol de carpetas.

## Alcance que se ejecuta primero

ARCH-02 inventaría capacidades y profundiza canal/mensaje de bienvenida. ARCH-03 fija límites del piloto. El piloto reutiliza configuration-service y welcome-configuration; no abre otra colección ni cambia los aliases welcome.msg/message. Conservar borrador, CAS, recibo de última publicación, configuración avanzada y tres tests originales. NSFW, verificadores retirados y el nodo privado siguen excluidos.

## Límites

Esta conciliación es estática: no demuestra OAuth, Gateway, Mongo, Redis, audio ni una publicación real. No inicia bot, envía mensajes, registra comandos, sincroniza emojis, publica rama o despliega. Rollback documental: revertir el commit que introduce la guía; no hay migración de datos en ARCH-01.
