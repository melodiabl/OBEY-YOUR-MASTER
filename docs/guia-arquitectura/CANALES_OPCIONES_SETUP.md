# Canales y opciones · setups remodelados

Continuación local del 18/10/2026: 14/63 archivos remodelados, sin despliegue. Esta entrega sustituye diez comandos: admincmdlog, logger/auditlog, reportlog, aichat, automeme, dailyfact, validcode, autobackup y autowarn. Sus aliases y categorías se conservan. Los otros 49 siguen en el plan.

Canales: un mensaje con canal actual, pendiente, selector nativo de texto/anuncios, Desactivar, Guardar, Descartar y Cerrar. Seleccionar no escribe; Guardar comprueba el servidor, visibilidad del actor y permisos del bot en el destino. Desactivar conserva el sentinel legacy `no`. No borra canales ni mensajes y no reinicia jobs. Las rutas existentes se conservan; logger solo edita logger.channel.

Opciones: selección explícita de códigos válidos, copias automáticas y las ocho protecciones con autowarn. No se invierte el estado al repetir. Las copias conservan propietario del servidor y Administrador del bot como requisitos, revalidados al abrir y actuar. Autowarn conserva campos ajenos al editor. El mismo controlador sirve a las categorías sin cambiar su política de activación.

Cada guardado utiliza setup-settings, cola compartida, confirmación Mongo y CAS. El conflicto conserva la selección, actualiza la revisión y requiere otro Guardar. Las sesiones son del mensaje/actor/guild, revalidan permisos y retiran controles al caducar. Los controles se reconocen antes de consultar datos; formularios y sesiones se cierran juntos.

Verificación temporal fuera del repo: siete grupos con Mongo, SyncMap y builders/collectors reales del SDK; seis definiciones en es/en, borrador/guardado/desactivación, permisos de destino, expiración, repetición/autowarn, propietario revocado y conflicto entre paneles. Base propia eliminada, cero rechazos no manejados. 17 grupos previos pasan, originales 25/25, tipos/imports de bienvenida y diff. No demuestra apariencia en cliente Discord, Gateway ni arranque completo. No se añadieron tests/scripts permanentes ni servicios externos.

Rollback: revertir código/menús mantiene elecciones guardadas en sus campos originales. No elimina datos ni revierte decisiones administrativas.
