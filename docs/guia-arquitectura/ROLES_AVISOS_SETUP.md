# Roles, avisos y niveles

Entrega local de tres comandos: setup-admin, setup-warn y setup-rank; acumulado 29/63. Se conservan aliases, stores y formatos consumidos por los handlers. Sin despliegue, asignaciones de roles ni sanciones reales durante las pruebas.

Permisos: roles generales por selector nativo; roles/usuarios por comando mediante selector de menciones, con paginación del catálogo de comandos cargados, activos y ajenos a Owner/NSFW. No se crean paths a partir del texto del usuario. Se preservan concesiones de comandos antiguos y campos ajenos. Ver ajustes ya no elimina concesiones automáticamente por ausencias en caché. Cambios solo se aplican con Guardar.

Avisos: umbrales numéricos y desactivación explícita, reglas `{warncount,roleid}` añadidas/quitadas por número sin sustituir otras entradas. Niveles: disabled/channel/rankroles en su store existente. Reglas por nivel conservan el mapa y admiten nivel cero. Añadir usa número + ID/mention del rol por línea y quitar solo el número; no requiere mensajes adicionales al canal. Los roles destinados a asignarse se comprueban en servidor, posición, gestión y permisos; los roles que solo conceden acceso a comandos no requieren ManageRoles del bot. Usuarios de concesiones se verifican como miembros del servidor.

El editor paginado conserva borradores al cambiar de ajuste/página, muestra guardado/pendiente, valida formularios y utiliza el mismo CAS/cola y guard de las entregas anteriores. Las reglas antiguas no editadas conservan metadatos desconocidos.

Seis grupos temporales con Mongo y SDK: formato/adición/reemplazo/quita, umbral/false, regla de avisos, nivel cero, paginación de 60 comandos y concesión por miembro preservando comandos retirados. Diez grupos de protecciones vuelven a pasar tras ampliar el editor. Bases eliminadas y cero rechazos no manejados. Tests originales/tipos/imports y diff verificados antes de commit. Sin fixtures o tests permanentes añadidos. Los escenarios aislados no prueban Gateway ni cliente Discord.
