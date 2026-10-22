# Cobertura documentada de eventos

Edición 0.13. Empezar por [capítulo 25](../sistema/25_COBERTURA_DE_EVENTOS_Y_CAMBIOS.md). [matriz.json](matriz.json) clasifica **82 entradas Gateway**, **69 acciones Audit Log** y **117 materiales existentes**. CSV separados permiten revisión por familia. Los protocolos de control y los eventos de aplicación propios no se anuncian como registros del servidor.

Se identificaron siete hallazgos concretos y 113 candidatos literales de listeners/archivos. No son un censo de handlers cargados ni prueba de recepción efectiva. Nombres de SDK candidatos requieren resolución contra lockfile. `unclassifiedReferenceItems: 0` significa que cada referencia consultada tiene una disposición de diseño, no que todo su código esté implementado.

`locales/es.json` y `locales/en.json` contienen **24 textos por idioma**, namespace `capture`, variables `{variable}`. Están pendientes de fusión y conexión; «Cobertura verificada» exige evidencia real del alcance y no es un estado predeterminado.

Las fuentes y hashes están en [proveniencia.json](proveniencia.json). Se conservan únicamente identificadores técnicos, clasificación y diseño propios; los documentos fuente completos no se distribuyen dentro del ZIP. No se capturaron mensajes reales, consultaron auditorías de usuarios ni cambiaron permisos/intents en esta edición.
