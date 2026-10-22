# Perfil del servidor de soporte

Edición 0.10. [Capítulo 22](../sistema/22_COMUNIDAD_Y_GITHUB.md), [mapa de canales](MAPA_DE_CANALES.md) y [perfil de diseño](perfil-soporte.propuesto.json).

Las 50 entradas son etiquetas normalizadas observadas en el video, con usos/audiencias propuestos; no son un inventario API completo. IDs y roles quedan null, perfil deshabilitado. No cargarlos como configuración runtime.

ES/EN incluyen 16 claves por idioma bajo `community`, pendientes de fusión y conexión. Conservan `{variable}` y no sustituyen catálogos anteriores. El texto se usa solo después del efecto que afirma; por ejemplo, `published` requiere un recibo confirmado.

No se incluyen fotogramas del video, URLs de webhook ni secretos. La base musical, Soundy, avatar/banner y landing se conservan. No se realizaron cambios en Discord ni GitHub.

## Mensajes incorporados 0.11

Los seis textos de configuración, bienvenida, tickets, reportes, GitHub y novedades se documentan en [mensajes completos](MENSAJES_DE_LA_COMUNIDAD.md). `mensajes.propuestos.json` define estados, audiencia, controles y materiales. Los nuevos textos `community.messages` amplían ES/EN sin borrar las 16 claves previas. Es material de implementación, sin mensajes publicados.
