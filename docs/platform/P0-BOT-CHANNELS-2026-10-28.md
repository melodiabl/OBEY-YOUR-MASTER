# P0 · canales permitidos para comandos

addbotchat y removebotchat comparten un servicio que usa el guardado condicional de setup-settings sobre Guild.botchannel. El argumento admite mención o ID exacto; ya no intenta resolver como ID el nombre del comando. Se comprueban membresía y permisos actuales antes de leer y guardar. Añadir valida el canal de destino y el acceso del bot; quitar permite retirar un ID configurado aunque el canal haya sido borrado.

El éxito se comunica después de la persistencia. Un conflicto conserva el cambio ajeno y pide consultar de nuevo; un fallo de almacenamiento no publica éxito en caché. El router dejó de eliminar entradas configuradas por una ausencia en su caché de canales. La respuesta muestra hasta veinte canales y el recuento restante. Al retirar el último, explica la regla vigente: lista vacía permite comandos en todos los canales según permisos.

Código 6adb96dd, imagen 78b4cd73c294: diez casos de comportamiento aislado, una regresión de fuente, 25 originales en imagen, tipos, dependencias y puerta de 1.009 hashes/675 comandos/779 alias/95 rutas pasan. HTTP 7/7, recursos 12/12, diez muestras saludables y cero reinicios. Respaldo previo de 59227376 bytes con CRC válido; imagen ee586c109e73 disponible para reversión.

Límites: fixtures de repositorio, sin guardados reales de prueba en producción. Reset conserva su revisión separada; recibos duraderos y recorrido autenticado en dos servidores pendientes. P0: 40 grupos/149 entradas/21 rutas, faltan 526/74. [Evidencia](evidence/p0-bot-channels-20261028.json).
