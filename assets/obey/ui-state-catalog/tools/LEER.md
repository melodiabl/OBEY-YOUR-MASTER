# Fuentes editables de materiales

Estas herramientas generan recursos; no se cargan desde el bot y no reemplazan scripts operativos ni pruebas. Requieren Node con @resvg/resvg-js y Python con Pillow en un entorno de edición de assets. No se añadieron dependencias al package.json del bot.

generate-approved.cjs conserva las fuentes de A y escribe approved-regenerated.json para comparación; no debe sustituir la aprobación/hashes actuales sin conciliación. generate-extension.cjs genera B y sus fotogramas. encode-motion.py produce GIF a partir de esos fotogramas. La ejecución vuelve a escribir los exports correspondientes: usar una copia de trabajo y revisar diferencias.

Los JSON de publicación, hashes, traducciones y galerías se concilian después de una edición. Editar la fuente de una imagen ya aprobada no aprueba automáticamente su nuevo resultado. Ningún generador publica emojis ni conoce tokens o IDs de aplicación.

Los codificadores Python opcionales se conservan solo en la entrega original extraída; no están instalados en este catálogo ni forman parte del runtime.
