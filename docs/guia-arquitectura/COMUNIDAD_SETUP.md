# Comunidad · setups remodelados

Entrega local: counter, autoembed, boost, boostlog y suggestion; acumulado 34/63. Mismos campos, aliases y handlers consumidores, sin despliegue.

Counter muestra canal y número; reiniciar prepara cero y exige Guardar. CAS incluye el número observado, de modo que un conteo intermedio provoca conflicto antes de sobrescribirlo. counterauthor no se elimina. Autoembed añade/quita canales de texto/anuncios sin destruir otras entradas, comprobando permisos del bot para enviar embeds.

Boost separa activación y mensaje por privado, sin cadenas de mensajes; activar requiere texto. Boostlog conserva canal/false y plantillas start/again/stop, junto al resto de boost. Las plantillas se almacenan literalmente, con sus placeholders y sin eval. Sugerencias conserva canal, textos y ambos emojis; validación local del formato permite emoji Unicode de un grafema, ID o mención custom. No afirma disponibilidad de un emoji externo. Los votos y campos desconocidos no se sustituyen.

Seis grupos temporales con Mongo/SDK: builders en ambos idiomas, conflicto al reiniciar contador, autoembed deduplicado, requisito del mensaje/placeholder literal, boostlog conservando DM y validación de emojis/textos/votos. Bases eliminadas y cero rechazos no manejados. Solo fixtures fuera del repositorio; pruebas originales/tipos/imports/diff comprobados antes de commit. Cliente Discord y eventos reales pendientes de verificación integrada.
