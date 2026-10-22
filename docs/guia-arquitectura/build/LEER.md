# Contratos de Build

Edición 0.8. Fuente funcional vigente: [capítulo 20](../sistema/20_BUILD_Y_REMODELACION.md); evidencia: [investigación](INVESTIGACION_SERVER_MAKER.md).

`alcance.json` registra capacidades propuestas y hashes de la base consultada. Es una especificación, no configuración cargada por el bot. `locales/es.json` y `locales/en.json` contienen **53 claves nuevas por idioma**, con placeholders `{variable}` y namespace `build`. Están pendientes de fusión y conexión con `handlers/i18n/index.js`; no reemplazan las 470 claves del delta visual ni el catálogo runtime.

La IA implementadora debe conectar cada texto a su estado real; los ejemplos no prueban que ya exista el botón o caso de uso. Revisar longitud, contexto y traducción dentro de Discord. Para nombres de canales se conserva el idioma seleccionado por el administrador, independiente de estos mensajes.

## Nombres públicos · edición 0.9

Entrada vigente `/servidor`, etiqueta **Servidor**. [Capítulo 21](../sistema/21_NOMBRES_CLAROS.md) y [contrato de nombres](comandos-propuestos.json) sustituyen los nombres públicos anteriores. Los 53 textos por idioma se conservan; se ajustaron título, copiar estructura e historial. La clave técnica `build` no obliga a mostrar ese nombre al usuario.
