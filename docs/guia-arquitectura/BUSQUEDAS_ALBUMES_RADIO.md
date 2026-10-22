# Búsquedas, álbumes y radio · 22/10/2026

El usuario notificó una sola pista en `!play adela`, álbumes incompletos y radio setup sin funcionar tras seleccionar Trinium NodeLink 02.

Se reprodujo: el proveedor devuelve `loadType:search` con una pista para `spsearch:adela` y diez para `ytsearch:adela`. El buscador finalizaba al ver search, aunque solo hubiese un elemento. Los selectores de Discord ahora solicitan resultados múltiples: conservan el candidato escaso, consultan la siguiente fuente y, si hace falta, los respaldos. Reproducción directa y prefijos explícitos mantienen su contrato. Se conservan validación musical, exclusión de Shorts, cancelación y procedencia de cada pista.

NodeLink también devuelve colecciones con `loadType:album`. Se normalizan al contrato playlist que ya consumen las entradas de reproducción; así se encolan completas y en orden. El catálogo compartido reconoce álbumes nativos. No se anexan pistas de una búsqueda anterior a una colección. La API v4 se contrasta con [documentación oficial de NodeLink](https://nodelink.js.org/docs/api/rest).

Radio: el diagnóstico real registraba API 50006 al elegir estación, en setup-choices.js:29. La transición intentaba enviar contenido, embeds y controles vacíos. Elegir una opción y regresar ahora retiran los controles conservando el mensaje hasta que se renderiza el destino. Permisos, autor, guardado y reglas de voz no cambian.

Verificación local: tres regresiones fallan antes y pasan después, diez casos de búsqueda/álbum/regreso y seis de radio (activación, retirada, permisos, sesión cerrada, conflicto y menú real con builders SDK). Los 25 tests originales, tipos y dependencias pasan. Una consulta real de solo lectura del catálogo modificado devuelve 11 pistas y siete álbumes para adela; el primero resuelve once canciones. Dos URLs de radio se resuelven como streams HTTP. No se inició voz ni se publicaron pruebas en Discord; transportes de activación y persistencia fueron aislados.

[Evidencia](../platform/evidence/search-radio-local-20261022.json). Los scripts y capturas temporales se retiran al finalizar. Continúan pendientes la escucha/recorrido real, adaptación de letras nativas y el resto del plan; no se declara resuelto el antiguo error de acceso/guardado sin ubicación.

La auditoría de esta entrega detectó un paquete high: `follow-redirects` 1.16.0. Se actualizó únicamente ese paquete del lock a 1.16.1, sin cambiar el manifest ni añadir dependencias directas. Los avisos del mantenedor describen [cabeceras en arrays](https://github.com/advisories/GHSA-q3jh-wrc6-jgq8) y [escape de cabeceras sensibles](https://github.com/advisories/GHSA-8r9p-f939-6h3c) al redirigir. Auditoría posterior: cero high/critical y 36 moderate heredadas; 25 originales y 19 regresiones repetidas con el parche instalado.
