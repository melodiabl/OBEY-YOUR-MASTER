# Implementación de OBEY con personaje

Trabajá desde `melodiabl/OBEY-YOUR-MASTER`, rama base `feat/motor-soundy`. Leé instrucciones del repositorio y `docs/OBEY_Diseno_Basado_en_Codigo.md`. Comprobá diferencias recientes antes de aplicar.

1. Usá `contracts/assets.registry.json` para los paths. Subí los 89 PNG de emojis, conservá sus IDs en un registro y no sobrescribas emojis ajenos. No inventes IDs. `integration/emoji-map.json` relaciona claves actuales de música con la nueva biblioteca.
2. Adaptá `integration/build-controls.js` a `handlers/music/embeds.js`; pasá IDs verificados, conservá los doce `mp_*`, permisos y estados. Hasta tener IDs usa fallbacks válidos. Revisá también el panel vacío de setup y el router.
3. Usá `integration/render-card.js` como punto de integración de las bases. El llamador entrega buffers de avatar/portada validados y los datos reales. Aplicá límites/validación a descargas y cargas de fondos. No renderices PNG completos en cada avance de progreso.
4. Unificá bienvenida real y comandos de prueba. Configuración por servidor y DM, sin reemplazar el avatar del miembro por el personaje. Conservá funciones de captcha, roles e invitaciones. La despedida no debe presentar el contador actual como orden histórico de llegada.
5. La capa del personaje puede desactivarse o cambiarse como personalización propuesta; el adaptador entregado admite un fondo completo alternativo, no implementa un editor web de capas. Diseñá esa configuración sin cambiar la identidad actual del dashboard.
6. Conservá temporizadores de reproductor y karaoke, sesiones, búsqueda de letras y fuentes de audio existentes. Usá `design/screens/lyrics_synced.svg` y `lyrics_plain.svg` como referencias. Paginación completa es una corrección funcional pendiente, no algo implementado en este ZIP.
7. Corregí `welcome.message` frente a `welcome.msg` con migración explícita y precedencia. Probá guardar/leer en dos servidores distintos.
8. Las 59 pantallas cubren las áreas de diseño. Fuera de música/bienvenida/despedida, inspeccioná el código del módulo antes de conectar botones o prometer funciones. No copies contenido de ejemplo a producción.
9. Validá subida/lectura de emojis, controles en cada estado, canciones sin portada, letras largas, seek/pausa/cambio de pista, nombres largos y avatar ausente. Mostrá capturas reales y resultados de pruebas.

Estado: assets completos exportados; adaptadores entregados; sin cambios de repositorio ni despliegue. `docs/VALIDATION.json` distingue verificaciones realizadas de las pendientes.
