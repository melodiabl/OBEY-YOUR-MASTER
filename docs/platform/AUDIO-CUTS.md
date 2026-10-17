# Entrecortes persistentes · 17/10/2026

El usuario confirmó que seguía oyendo cortes después del reinicio. Se utilizó la instrumentación ya desplegada para comparar proveedores. Esta intervención cambia configuración operativa; no altera el motor ni sus dependencias.

## Evidencia anterior

El bot no presentaba reinicios, excepciones de reproducción, stuck o desconexiones del nodo en la ventana revisada. La sesión estaba reproduciendo Spotify sin filtros, volumen 100 y autoplay activo. Serenetia publicaba ping de voz principalmente de 169–172 ms (un pico de 229) y déficit repetido de 196–224 frames; son estadísticas agregadas del proveedor. Por separado, la posición real del reproductor progresó 27920 ms en unos 30001 ms y 27840 ms en unos 30047 ms en dos intervalos de una misma reproducción sin filtros. Esto evidencia avance más lento que el reloj durante esas muestras, compatible con la queja, sin localizar por sí solo la causa interna.

Los tres nodos volvieron a completar handshake y tres búsquedas musicales. RTT de control mediano: Serenetia 108,8 ms, GDjkhp 168,3 ms y MilloHost 204,5 ms. GDjkhp resolvió además el enlace concreto de la sesión como pista Spotify con la misma duración de 201800 ms. Estos chequeos no validan audio audible ni prueban que los frames deficitarios sean exclusivos de esta guild.

Existe un [reporte de cortes en el envío DAVE de Lavalink](https://github.com/lavalink-devs/Lavalink/issues/1222) y una [propuesta de actualización del envío](https://github.com/lavalink-devs/Lavalink/pull/1235). Es una hipótesis compatible, no un diagnóstico confirmado de este proveedor; no hay captura UDP ni acceso a su implementación/configuración para demostrarla. No se desactiva el cifrado ni se instala esa propuesta en un servicio de terceros.

## Cambio aplicado

Principal global `LAVALINK_DEFAULT_NODE=gdjkhp` en `.runtime/bot-release.yml`; la recuperación vigente copia esa selección. Respaldos Serenetia y MilloHost. El registro público, sus prioridades y credenciales no se modificaron; la preferencia global existente coloca GDjkhp primero. Las sesiones en auto usan esa selección. La simulación local con el pool real confirmó el orden GDjkhp → Serenetia → MilloHost al marcar fallidos los anteriores; no se derribaron proveedores para probarlo.

Se recreó exclusivamente el bot con cierre y recuperación existentes, conservando código `7650e56938c285636a73dbd819101364bf44eedf` e imagen `edb8a5e2a7c30b4ea1753fd74646b1fafd996c37229a8d5c07662b9c0164bc6d`. La sesión guardada estaba ya en el final de la pista (201800 ms); se restauró y el evento finished activó autoplay, con nueva reproducción observada. No se añadió una canción de prueba ni se vació la cola. Imágenes y Redis conservaron imagen/fecha de inicio. Nodo privado apagado/excluido y puerto 2333 cerrado; Nazha/Trinium siguen deshabilitados.

## Resultado observado

En GDjkhp, después del arranque y el cambio de pista:

| Hora local | Posición del reproductor | Ping de voz | Frames enviados del nodo | Déficit | Nulos |
| --- | ---: | ---: | ---: | ---: | ---: |
| 02:02:37 | 9740 ms | 339 ms | 0 | 0 | 0 |
| 02:03:07 | 39740 ms | 338 ms | 1142 | 0 | 0 |
| 02:03:37 | 69760 ms | 337 ms | 2642 | 0 | 0 |

La posición avanzó 30000 y 30020 ms en intervalos de aproximadamente 30005 ms; el último intervalo añadió 1500 frames enviados en 30 s. Las cifras iniciales de frames en cero no se interpretan como prueba de ausencia de pérdida; las posteriores sí muestran actividad reportada. Los frames siguen siendo agregados del nodo. El ping de voz es mayor que el del proveedor anterior: un ping de control menor no garantizó continuidad, y esta muestra no justifica afirmar baja latencia de voz.

Bot healthy/cero reinicios, Mongo/música listos y los tres nodos públicos conectados. 24 pruebas existentes de sesiones/recuperación/pool pasaron; no se modificó código para este cambio. Las 16 entradas locales previas se conservaron exactamente.

Se solicitó al usuario comparar el sonido tras el cambio. La confirmación auditiva está pendiente y no se declara resuelto el defecto audible. Si persiste, conservar hora, proveedor y muestras del reproductor; no alternar repetidamente ni atribuirlo automáticamente a la implementación DAVE. Para revertir esta selección, cambiar únicamente el default a Serenetia y recrear solo bot; no cambiar la imagen, restaurar Mongo ni encender el nodo privado.

[Evidencia de mediciones, reproducción y runtime](evidence/audio-cuts-runtime.json).
