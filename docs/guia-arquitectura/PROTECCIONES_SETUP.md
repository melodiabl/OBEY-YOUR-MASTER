# Protecciones · código y menús

Entrega local: doce archivos, acumulado 26/63. Anticaps, antimention y sus tres redirects, antispam, antidiscord, antilink, antinewaccount, ghost-ping-detector, mute y blacklist. Aliases y campos de almacenamiento conservados; sin despliegue ni acciones de moderación durante la verificación.

El formulario comparte selección de ajuste, valor guardado/pendiente, edición local, Guardar/Descartar/Cerrar. Booleanos y acciones son elecciones explícitas, cantidades/formularios con validación, recursos mediante selectores nativos. Añadir/quitar listas conserva las entradas anteriores incluso si exceden las 25 opciones de Discord; Vaciar solo deja un borrador hasta Guardar. Campos/rutas son definidos por código y los restantes campos del documento no se sustituyen.

Límites: porcentajes 0–100, cantidades enteras 1–100, reincidencias 0–15, duración mute hasta siete días. Duraciones aceptan milisegundos o expresiones de ms como `2 days + 6 hours`; se almacenan números. Se corrige el acceso roto a `message.includes` del asistente anterior de mute. Método role requiere rol real, no administrado, no Administrador y debajo del rol del bot, con ManageRoles. El modo timeout conserva el método nativo. Nuevas cuentas conserva enabled/delay/action/extra_message; kick y ban son las dos acciones. Detector conserva false al desactivarse y milisegundos. Blacklist usa su store propio.

Permisos y recursos se revalidan al guardar, caducar impide nuevas escrituras; sesiones/formularios tienen alcance y cierre de setup-session. Cola/CAS de setup-settings conserva escrituras aceptadas en el flush y rechaza conflictos, manteniendo borradores para revisión.

Diez grupos temporales con Mongo/SyncMap y SDK reales: todos los campos/idiomas/builders, límites/NaN/infinito, porcentaje por modal, estado repetido, listas con 30 entradas y añadido/quita, edad mínima/ban, sentinel false, rol requerido, palabras/otros campos y permisos revocados. Cero rechazos no manejados y base eliminada. Regresiones previas y los 25 originales se comprueban antes del commit; los originales son los únicos tests permanentes. No demuestra cliente Discord/Gateway ni ejecución de sanciones.

Rollback de código conserva las mismas preferencias almacenadas. Las sanciones y temporizadores de los handlers no se alteran con esta entrega.
