# Compatibilidad observada en el paquete

Edición 0.12. Base: ZIP edición 0.11, versión 10. Lectura estática de package/lock/Docker y rutas listadas en [evidencia-base.json](evidencia-base.json). No se ejecutó npm ci, no se importaron paquetes instalados y no se conectó Discord. Un lockfile indica resolución prevista, no confirma qué está instalado en producción.

| Elemento | Evidencia del archivo |
| --- | --- |
| package.json discord.js | ^14.18.0 |
| package-lock discord.js | 14.27.0 |
| builders resuelto | 1.14.1 |
| REST resuelto | 2.6.3 |
| discord-api-types resuelto | 0.38.56 |
| @discordjs/voice resuelto | 0.19.2, engine >=22.12.0 |
| engines raíz | node >=20.0.0 |
| Docker | node:22-slim, sin patch/digest fijado |

Hay discrepancia entre el mínimo declarado en la raíz y la dependencia de voz. Antes de desplegar: elegir runtime compatible con el grafo completo y dependencias nativas, reflejarlo en manifest/CI/imagen y fijar una imagen reproducible. El mínimo conocido por voice es 22.12; no se deduce que ese mínimo baste para cada addon del proyecto. Esta edición no cambia engines ni actualiza paquetes.

Las páginas de README/instalación de docs pueden reflejar la versión actual del proyecto aunque se abra una URL versionada. Para motores, usar lockfile/tarball exacto y verificación del entorno, no copiar una recomendación genérica de main. El plan no cambia a otra versión principal de discord.js para usar funciones que ya tienen documentación en el grafo resuelto.

## Compatibilidad de API, SDK y aplicación

Documentación versionada consultada: ContainerBuilder en discord.js 14.27.0; FileUploadBuilder, CheckboxBuilder y RadioGroupBuilder en builders 1.14.1; ModalSubmitFields 14.27.0 con getters para campos modernos. Esto acredita documentación de biblioteca, no prueba de serialización o comportamiento en un cliente Discord real.

Antes de activar: importación de exports exactos, construcción/serialización y lectura de respuestas de los componentes elegidos con una instalación reproducible; después, pruebas en guild autorizada. Si el export o parser necesario falta, mantener fallback y revisar actualización acotada con lockfile; no desactivar validadores o improvisar un parser incompatible. Si se importa directamente un paquete, declararlo como dependencia directa o usar el reexport confirmado de discord.js; no depender accidentalmente del hoisting de un transitivo.

| Archivo / observación | Cambio de integración requerido |
| --- | --- |
| handlers/slashCommands.js usa esquema propio y StringAutocomplete | Pasar localizaciones/tipos nuevos por adaptador de registro; conservar slash actuales |
| interactionCreate.js sale de ese handler ante no-chat-input | Despachar contexto/modal/select por propietario; otros listeners actuales también requieren conciliación |
| handlers/events.js omite eventos guild si DB no está lista | Diseñar respuesta explícita de indisponibilidad para interacción; no ejecutar negocio sin DB |
| i18n/index.js ES/EN y variables | Fusionar deltas y registrar metadatos localizados por separado |
| assets/registry.js valida identidad/hash | Ampliar el registro actual y usar fallback, sin otra tabla de IDs competidora |
| soundboard/play.js ya tiene autocomplete | Preservar función y comprobar convivencia con música/Lavalink |

No se ejecuta el script start o test de package como evidencia automática: la guía anterior retiró herramientas y servicios reales requieren entorno autorizado. Las pruebas de integración futuras deben ser pertinentes a la capacidad modificada.
