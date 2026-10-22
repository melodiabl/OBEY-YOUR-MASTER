# Idiomas y un repositorio que se entiende

## Idiomas

Destino de planificación: español, inglés, portugués de Brasil, francés, alemán y japonés; árabe como siguiente etapa para comprobar RTL. El usuario no queda limitado a ES/EN. Ningún idioma se anuncia completo por incluir un JSON vacío o una traducción automática. Los seis catálogos semilla adjuntos tienen solo 18 textos nuevos cada uno, son borradores y no están conectados al runtime. No sustituyen los catálogos actuales ni acreditan traducción integral.

Mantener el resolvedor único previsto en sistema/05. Normalizar BCP47 y conservar región. Público: override autorizado del módulo → guild → es. Privado/DM: preferencia usuario → locale interacción disponible → guild si aplica → es. Fecha/hora usan timezone IANA distinta de idioma; timestamps Discord se renderizan en cada cliente. Locale de nombres slash debe mapearse a valores admitidos por Discord (p. ej. en-US), no a cualquier código de web.

Textos por módulo y claves estables. Valores/IDs/códigos de error sin traducir; labels/descripciones localizados. No guardar texto ya traducido como estado de negocio. El frontend no manda permisos ni nombres de planes que el backend deba creer.

Propuesta de plurales: introducir ICU con intl-messageformat solo al migrar el resolvedor y comprobar el runtime. El interpolador actual de {variable} no ejecuta ICU. No pegar plurales ICU en archivos actuales sin adaptador. Migrar una clave/superficie a la vez, con formatVersion explícito. Ejemplo futuro: {count, plural, one {# canción} other {# canciones}}. Mantener números, importes y listas en Intl; no concatenar frases ni aplicar reglas de plural españolas a japonés.

Fuentes: [ICU/FormatJS](https://formatjs.github.io/docs/core-concepts/icu-syntax/), [localizaciones de comandos](https://docs.discord.com/developers/interactions/application-commands).

Flujo de traducción: inventario → extracción → traducción → revisión por hablante → validar claves/variables/límites → captura con nombres largos → revisión → habilitar locale para el módulo publicado. CI bloquea variables ausentes, claves eliminadas con consumidores y JSON inválido; reporta fallback sin incluir contenido privado. No ejecutar traducción remota de mensajes de usuarios sin una función explícita y sus reglas.

Canvas/tarjetas: fuentes con licencia y cobertura real de glifos, tamaño mínimo, ajuste de texto, nombres largos y emoji de avatar; fallback determinista. Árabe requiere shaping/dirección y prueba del renderer, no invertir strings. No traducir identificadores de plataformas ni recolorear sus marcas como iconos ambiguos.

## Organización pública de GitHub

Conservar historia y rama. No borrar el repositorio para que «se vea limpio»: ordenar README, rutas, documentación y releases permite entenderlo sin perder trazabilidad. Si luego se decide trasladarlo, planificar export de issues/releases, redirecciones y secretos por separado; esta guía no elimina nada.

README objetivo: qué hace OBEY, captura real de la versión publicada, cómo instalar, configuración mínima, módulos realmente disponibles, soporte y estado del proyecto. Screenshots de competidores van solo a investigación; mockups deben etiquetarse. No publicar «todo funciona» ni 32 módulos listos por tener 32 fichas.

| Archivo/carpeta | Contenido mínimo |
| --- | --- |
| README.md | propuesta, inicio rápido, configuración, funciones reales y enlaces |
| CONTRIBUTING.md | entorno probado, estilo, añadir módulo/idioma/material, flujo PR |
| SECURITY.md | canal privado real para vulnerabilidades y versiones soportadas |
| CHANGELOG.md | cambios publicados, migraciones y problemas conocidos |
| LICENSE + THIRD_PARTY_NOTICES | licencia elegida y avisos comprobados |
| docs/architecture | mapa, fronteras, contratos y ADR vigentes |
| docs/user | tutoriales por recorrido con mensajes y capturas actuales |
| docs/operations | VPS, backup/restore, incidentes, logs y rollback |
| docs/contributing | ejemplos concretos y traducciones |
| .github | plantillas breves y workflows adecuados al stack real |

No inventar dirección de seguridad o email del autor. La base contiene .github/.github/FUNDING.yml y .github/FUNDING.yml: conciliar duplicación en una tarea de limpieza; no afirmar resuelta sin revisar intención. Conservar los tres tests originales y no restaurar los 122 retirados.

## CI y entregas

Pipeline propuesto: npm ci con Node/lock conciliados; sintaxis/lint del área cambiada; tipos del piloto; comprobación de contratos/locales/assets; pruebas de invariantes donde haya riesgo; build del contenedor cuando cambie despliegue. Secretos solo en entorno autorizado; no pruebas públicas conectadas a la guild de soporte.

Pruebas importantes: transición de cola y control duplicado, autorización entre guilds, cierre repetido de ticket, pérdida de datos, premio duplicado, webhook desordenado y restore. No producir cientos de pruebas que copien el código o una batería de scripts para cada documento. Explicar qué se comprobó y qué sigue sin conexión real.

Cada PR aborda un recorrido, muestra antes/después, migración de datos, aceptación y rollback. Branch protection y escáner de secretos son configuraciones propuestas, no se cambiaron aquí. Deployment por release identificado, smoke test y rollback; publicar novedades públicas después de verificar despliegue. El hash de un ZIP no demuestra que ese código esté ejecutándose.
