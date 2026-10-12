# ADR 002: borrador y publicación dentro del documento Guild

Fecha: 2026-10-12. Estado: aceptada para canal y mensaje de bienvenida.

La base de bienvenida existente ya compara sus aliases y guarda el mensaje/canal con una sola operación Mongo. Separar el borrador en otra colección exigiría una transacción o una operación durable para no publicar una versión distinta de la revisada. Se mantiene la fuente legacy como autoridad de la configuración activa y se añade `configurationDrafts.welcome` al mismo documento Guild. No se migra ni guarda nada al consultar.

Guardar borrador compara su revisión y los valores publicados; no altera canales, mensajes, roles ni runtime. Publicar compara nuevamente el documento completo de configuración y el borrador exacto, sincroniza los aliases y cambia el borrador a publicado en la misma actualización. Su contador se conserva después de publicar, evitando reutilizar una revisión antigua. SyncMap.exclusive comparte la cola con escritores existentes y el cache se actualiza tras la confirmación de Mongo. La comparación de Mongo protege también entre instancias.

El envelope incluye guildId, moduleId, schemaVersion, revision, enabled, config, updatedBy y updatedAt. Para compatibilidad, revision publicada conserva el hash actual de bienvenida; el borrador tiene contador monotónico y baseRevision. Enabled describe si hay destinos heredados activos; este incremento no introduce un switch global ni desactiva DM/segundo canal. Campos editables: channelId y message. SchemaVersion diferente se rechaza hasta disponer de una migración explícita.

El borrador se comparte entre administradores autorizados del servidor. El autor se toma de la sesión del backend. Publicación requiere permisos OAuth frescos, miembro actual y acceso del bot al canal. Las capacidades normalizadas son nombres internos, nunca un permiso concedido por existir una entrada de manifest. Los handlers de entrega existentes no se inicializan otra vez.

El último registro de publicación conserva operationId para reconciliar su reintento sin consumir un borrador nuevo. No es un historial de operaciones de siete días: esa ampliación del contrato transversal sigue pendiente. Un escritor legacy distinto invalida la revisión; el editor conserva texto local y obliga a actualizar/comparar antes de continuar. La vista previa usa el mismo renderer de texto con datos ficticios y no envía mensajes.

Comprobado con MongoDB aislado entre dos instancias y con Express/EJS/CSRF en Chromium. No se ejecutó el bot ni se publicó configuración en Discord real. Ampliar el adaptador por contrato antes de añadir módulos o campos; no registrar implementaciones vacías para cubrir la lista de 32.

Fundamento: [atomicidad en MongoDB](https://www.mongodb.com/docs/manual/core/write-operations-atomicity/) y [findOneAndUpdate de Mongoose](https://mongoosejs.com/docs/tutorials/findoneandupdate), contrastados además con Mongoose instalado y la prueba real aislada.
