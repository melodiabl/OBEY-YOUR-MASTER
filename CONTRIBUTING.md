# Contribuir a OBEY

Parte de un checkout identificado por commit y consulta el [plan activo](tasks/plan.md). Conserva los IDs originales del plan y la historia; un inventario completo no acepta por sí solo una capacidad.

## Entorno y alcance

Sigue [instalación](docs/operations/INSTALACION.md) con Node.js **22.23.4** y los lockfiles de raíz/frontend. Usa una aplicación Discord y datos de desarrollo; no copies el entorno de producción. El arranque puede sincronizar comandos y ejecutar handlers. La edición de documentación no necesita arrancar servicios.

Mantén cada cambio centrado en un recorrido: problema, comportamiento final, permisos, persistencia, fallo/recuperación y evidencia. Las entradas Discord, HTTP y realtime deben delegar en la operación correspondiente; no crees otra cola, autorización o escritor para una nueva pantalla. Respeta las fronteras descritas en [las decisiones](docs/platform/adr/) y [el inventario](docs/platform/operation-ownership.json). Migra carpetas cuando exista un responsable funcional; no crees por adelantado todo el árbol objetivo.

## Verificar

Tras instalar dependencias, los comandos existentes son:

```sh
npm test
npm run typecheck:welcome
npm run dependencies:welcome
npm run web:typecheck
npm run web:build
node scripts/verify-p0-classification.js
npm audit --audit-level=high
npm audit --prefix dashboard/frontend --audit-level=high
```

Ejecuta los pertinentes al cambio. La auditoría bloquea avisos altos/críticos; los moderados registrados conservan su deuda. El script `scripts/obey-assets.js` valida recursos sin `--apply`; aplicar publica emojis. La comprobación de clasificación valida inventario y trazabilidad, no acepta todo el negocio. Si cambia un consumidor inventariado, actualiza sus hashes/contratos con evidencia; no borres la entrada para eludir una comprobación.

Los tres archivos originales de `test/` se conservan. No repongas baterías retiradas, generadores auxiliares o scripts temporales en la entrega. Para cambios de comportamiento, demuestra las invariantes y casos de regresión relevantes, conserva resultados y retira los verificadores temporales al cerrar. No uses sorteos, restauraciones, voz o mensajes de usuarios reales como fixtures.

## Textos y materiales

Usa los catálogos y materiales existentes; ES/EN son la base por conciliar. Añadir una clave exige conservar variables, límites y consumidores. No declares traducido todo el producto por aportar textos semilla. Revisa [MATERIALES](MATERIALES.md) y [los avisos](THIRD_PARTY_NOTICES.md): recursos aprobados, propuestas y capturas de terceros tienen destinos distintos. No reintroduzcas NSFW ni las fuentes, comandos o audios retirados.

## Entregar

La solicitud de cambios debe explicar el problema, el comportamiento resultante, qué se verificó y qué permanece pendiente. Identifica commit/imagen si hubo despliegue y separa CI local de CI remoto. No incluyas secretos ni datos de usuarios en diffs o capturas. No se cambia una puerta de fase a aceptada sin su criterio original.

GitHub permite solicitudes de cambios, pero actualmente tiene Issues y Discussions desactivados. Usa [SUPPORT](SUPPORT.md) para conocer el estado del contacto y [SECURITY](SECURITY.md) para vulnerabilidades; una solicitud de cambios pública no es un canal privado de seguridad.
