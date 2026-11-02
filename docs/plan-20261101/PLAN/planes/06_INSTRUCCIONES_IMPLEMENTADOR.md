# 06 · Instrucciones para la persona/IA que implemente (cuando esté autorizado)

**ANTES DE CUALQUIER CAMBIO:** solicitar autorización explícita del dueño para modificar repositorio, rama, VPS o datos. Esta documentación no autoriza escribir en GitHub ni desplegar.

1. Comprobar HEAD remoto, rama autorizada, despliegue actual y matriz de diferencias con este ZIP original; no sobrescribir P0 reciente.
2. Leer `LEER_PRIMERO.md`, árbol completo, 32 fichas y planes 01–05. Registrar discrepancias con evidencia, no asumir que el ZIP archivado es HEAD.
3. Preparar una rama de trabajo *solamente después de autorización*. Prohibido editar directamente `master` o desplegar sin prueba.
4. Migrar por verticales con pruebas previas y gates. NO crear wrappers inútiles o índices vacíos para aparentar avance.
5. Actualizar imports, rutas dinámicas, command loader, eventos, tests, documentación, jobs, imágenes, binarios, middleware y frontend que consuman cada ruta.
6. Preservar contratos actuales de comandos visibles, datos Mongo, permisos, sesiones, traducciones, estados Soundy. Evitar cambio de formato/biblioteca no relacionado.
7. Solo una autoridad de emojis/gifs **para Discord** y una de música. La web usa React + Next.js; NO crear material visual nuevo para web. Estado real manda al diseño, no al revés.
8. Nunca meter tokens, secretos, archivos `.env`, logs de usuarios o muestras sensibles en el ZIP público.
9. Revisión por módulo: comparar comportamiento antes/después y adjuntar pruebas de sistema. Reportar fallos, parciales y funcionalidad diferida.
10. Una vez completado el reemplazo, eliminar el código legacy sin consumidores comprobados y entregar árbol definitivo, changelog, informes, build/deploy reproducible y rollback.

**Prohibido afirmar «sin errores» basándose únicamente en sintaxis/imports o una previsualización HTML.**
