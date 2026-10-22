# Nombres públicos claros

Edición 0.9 · 21/10/2026, America/Asuncion. El usuario rechaza los nombres de comandos basados en Architect porque no son fáciles de entender. Esta decisión sustituye la propuesta pública anterior de `/build` y la conservación permanente de `/architect`.

## Entrada y acciones definidas

**`/servidor`** abre **OBEY · Servidor**. Descripción: «Construye, remodela y configura la estructura de tu servidor». Las tareas se eligen desde el panel; opcionalmente `accion` abre directamente una tarea. El valor omitido abre el centro. No exige aprender otros siete comandos.

| Acción del panel | Qué hace |
| --- | --- |
| Construir | Preparar estructura con asistente, descripción IA o plantilla |
| Remodelar | Modificar canales, roles, nombres y colores seleccionados |
| Crear un recurso | Añadir canal, categoría o rol |
| Plantillas | Guardar, importar y reutilizar estructura |
| Copiar estructura | Importar desde otro servidor autorizado |
| Copias de seguridad | Capturar estructura y revisar cobertura |
| Historial | Consultar trabajos, cambios y recuperación disponible |

Especificación de nombres y valores estables: [comandos propuestos](../build/comandos-propuestos.json). Es contrato de implementación, no un manifiesto registrado en Discord.

No definir estas acciones como subcomandos slash si se desea que `/servidor` funcione solo: Discord indica que añadir subcomandos hace invocable únicamente la combinación completa. Usar un parámetro string opcional con elecciones y navegación por componentes. Fuente: [documentación oficial de comandos](https://docs.discord.com/developers/interactions/application-commands).

## Idiomas y lenguaje de interfaz

Nombre predeterminado `servidor`, localizado a `server` para inglés; descripción y elecciones también localizadas. Usar las localizaciones de Discord para los nombres visibles y valores internos estables para el enrutamiento. El bot resuelve los mensajes con su catálogo ES/EN. No anunciar idiomas incompletos.

Títulos, ayuda, onboarding y etiquetas usan **Servidor**. Los textos describen acciones concretas: «Revisar cambios», «Aplicar cambios», «Guardar borrador», «Copiar estructura», «Ver historial». No mostrar Architect, blueprint, preflight, canary, snapshot o rollback al administrador como nombres de acciones. Sus equivalentes públicos son «propuesta», «comprobar permisos», «disponibilidad», «copia de estructura» y «revisar reversión», según contexto.

Una capacidad no implementada aparece como no disponible o se oculta; el cambio de nombre no la habilita. IA significa «Describir con IA», con explicación del procesamiento y alternativa guiada. Los nombres del servidor del usuario se conservan al cambiar el idioma de la interfaz.

## Transición sin perder datos

El nombre técnico actual `architect`, rutas, schemas, identificadores de assets y claves de persistencia pueden permanecer durante la migración. No hacer una sustitución global que rompa imports, datos o permisos. El usuario ve nombres comprensibles; el inventario técnico sigue documentando los archivos reales.

1. Conciliar archivo de comando, registro de capacidades, cargador y comandos registrados en Discord. Identificar si existen `/architect`, `/config architect` u otras entradas.
2. Preparar handler `/servidor` que delegue al servicio actual y al presentador común; traducir título, descripción, elecciones, errores y ayuda.
3. Cambiar la etiqueta del acceso de configuración a **Servidor**; conservar el valor interno legacy cuando corresponda. No inventar `/config servidor` como sintaxis si el registro real usa otra forma.
4. En la publicación autorizada, renombrar o retirar la entrada antigua en el mismo alcance global/guild donde existe. No borrar comandos ajenos mediante un overwrite indiscriminado. No dejar dos centros públicos permanentes.
5. Adaptar componentes antiguos aún válidos con autorización y revisión originales. Ante una referencia expirada, indicar «Abre /servidor para continuar». No ejecutar por un nombre o custom ID antiguo sin validación.
6. Conservar borradores, planes, IDs, bindings, favoritos y otros datos; actualizar documentación de ayuda y enlaces de entrada. Las rutas web internas existentes no requieren cambiar para resolver este nombre público.

## Criterios de cierre

`/servidor` sin argumentos abre el panel; cada elección opcional abre la misma acción que el botón; ayuda y comandos registrados coinciden; la interfaz ES/EN no expone etiquetas técnicas del módulo; controles viejos autorizados funcionan o explican expiración; no se pierden borradores; no se publica una capacidad por el solo hecho de renombrarla.

Esta edición cambia documentación y contratos. No modifica el backend ni registra comandos por sí sola. La implementación del recorrido está en [capítulo 20](20_BUILD_Y_REMODELACION.md).
