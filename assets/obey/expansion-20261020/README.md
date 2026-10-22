# OBEY · Escenas del personaje y movimiento

Edición integrada 0.6. Esta carpeta conserva tres PNG transparentes de personaje y seis GIF con sus PNG alternativos y fuentes vectoriales de movimiento. Los 24 iconos antiguos de registros se retiraron de esta entrega: el catálogo vigente está en `../catalog-eventos/`.

Abrir index.html para revisar estas nueve entradas. Las escenas son vacío, sin conexión y revisión de seguridad; no reemplazan título, explicación ni acción traducibles. Los seis GIF indican registro, sincronización, revisión, envío, reconexión y atención; no prueban éxito ni representan posición de audio, porcentaje o tiempo restante.

Manifest: nueve entradas; applicationEmojiId=null y runtimeRegistered=false. Los PNG del personaje se conservan con su alpha original. Los GIF tienen 32 fotogramas de 50 ms y PNG en posters como alternativa estática. Los títulos/alt/acciones se resuelven con i18n al integrar.

Las escenas se usan como imagen de estado, no como emoji diminuto. Los GIF deben reflejar un estado real y no añadir ediciones decorativas delante de acciones musicales. No se cambió Soundy, avatar, banner, marcas de plataformas ni landing.

Para editar movimiento: sources contiene el fotograma de referencia; tools/build-assets.cjs exporta solo las seis secuencias usando Node y sharp en un entorno de diseño. tools/encode-gif.py usa Pillow. No son dependencias nuevas del proceso del bot. Después de regenerar, recalcular hashes del manifest y excluir frames temporales del paquete.

Los prompts de las tres ilustraciones siguen en PROMPTS.md. Los recursos requieren revisión a tamaño real e integración de consumidores; incluirlos no acredita publicación Discord.

Los codificadores Python opcionales se conservan solo en la entrega original extraída; no están instalados en este catálogo ni forman parte del runtime.
