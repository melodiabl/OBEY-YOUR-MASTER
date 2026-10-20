# Visibilidad de registros · 20/10/2026

La política anterior exigía acceso de `@everyone` al origen y rechazaba cualquier denegación de ViewChannel. Así ocultaba detalles legítimos en servidores donde el acceso depende de roles, incluso con el mismo público en origen y destino.

El consumidor conserva los detalles únicamente cuando puede demostrar que toda combinación de roles que ve el destino también ve el origen. Compara permisos base, sobrescrituras de @everyone, combinación de roles y excepciones personales, sin descargar miembros ni depender de su presencia en caché. Conserva acceso administrativo, restricción de motivos de auditoría a staff, opt-in de contenido y tratamiento conservador de threads/orígenes desconocidos. Los movimientos de voz siguen comprobando ambos canales.

Se aplica el [orden oficial de permisos de Discord](https://docs.discord.com/developers/topics/permissions). La comparación usa cláusulas booleanas acotadas, evitando enumerar todas las combinaciones de roles en producción.

Verificación temporal: 380 grupos, 350 perfiles distintos y 16.800 asignaciones contrastadas con `permissionsFor` del SDK; servicio real con transporte aislado, canales privados y movimientos mixtos. Dos capturas de solo lectura del servidor afectado reproducen cinco canales de voz: tres compatibles y dos privados que continúan restringidos. Los 25 tests originales, tipos y reglas de dependencias pasan. Sin dependencias nuevas; auditoría: cero high/critical y 36 moderate preexistentes.

El aviso de las 22:03 no incluye el canal de origen; esta entrega corrige el fallo demostrado, sin afirmar haber identificado ese evento exacto. No se enviaron mensajes ni provocaron eventos de prueba en Discord. El verificador y las capturas privadas temporales se retiran después de conservar evidencia agregada. Historial, retención, casos enlazables y entrega durable permanecen pendientes.

[Evidencia local](../platform/evidence/log-visibility-local-20261020.json).
