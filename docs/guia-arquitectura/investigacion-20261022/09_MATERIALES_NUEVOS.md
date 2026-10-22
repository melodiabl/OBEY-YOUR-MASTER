# Cuatro propuestas para las capacidades nuevas

Familias NX01–NX04 originales, dibujadas en SVG y exportadas a PNG; dos variantes GIF. Son propuestas pendientes de revisión visual, sin IDs reales y excluidas de publicación automática. Se conserva el material A aprobado y el catálogo anterior. Un contrato semántico existente equivalente tiene prioridad: conciliar antes de sumar un emoji duplicado.

| Familia | Uso | Archivos | Condición |
| --- | --- | --- | --- |
| NX01 Voto | Enlace a votar y resultado de recepción | idle/result SVG y PNG 128/256, motion.gif | Confirmar solo tras voto válido persistido |
| NX02 Suscripción | Vista de plan y periodo | idle/result SVG y PNG 128/256 | Un recibo visual no es prueba de pago |
| NX03 Acceso | Entitlement activo | idle/result SVG y PNG 128/256 | Derechos vigentes para sujeto/feature; no permiso admin |
| NX04 Traspaso | Diagnóstico del equipo | idle/result SVG y PNG 128/256, motion.gif | Mostrar avance real del traspaso, con texto |

Rutas: assets/obey/growth-proposals/<familia>/. El manifest describe uso, locale y guard. Cantidad: 16 PNG, 8 SVG y 2 GIF. Los GIF son feedback visual, no máquinas de estado ni relojes. Ofrecer estático por preferencia del usuario, cliente o fallo de carga.

No existe un listener de clic dentro de una imagen Discord. El backend recibe la interacción, valida/ejecuta y puede editar el mensaje con una variante. Discord decide cómo anima el cliente; no garantizar inicio por clic o reproducción única. Los botones conservan estilos nativos disponibles: no se puede forzar cualquier color de fondo.

Exportar transparentes, probar legibilidad a tamaño emoji, revisar peso contra el límite efectivo antes de subir y registrar ID, nombre, hash y animated en el registro real. No publicar referencias de otros bots ni renombrar estos IDs como si ya fueran snowflakes.

Las tarjetas existentes de bienvenida, despedida y rango siguen en su catálogo. Este estudio no las vuelve a generar ni cambia avatar/banner. Canvas debe componer datos reales, locale y plantilla sobre esos materiales; no enviar una tarjeta con nombre o nivel ficticio como resultado real.
