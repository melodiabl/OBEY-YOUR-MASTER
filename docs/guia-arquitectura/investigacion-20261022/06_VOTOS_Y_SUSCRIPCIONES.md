# Top.gg, suscripciones y derechos premium

Estado: diseño previo a implementación. No se configuró Top.gg, proveedor de pago, tienda ni SKU. País/entidad del comerciante, precios, impuestos y reglas de devolución requieren datos reales; no se inventan ni se pide abrir una cuenta para cerrar este documento.

## Top.gg actual

Las páginas v1 consultadas documentan vote.create, webhook.test, firma x-topgg-signature sobre timestamp.rawBody con HMAC SHA256 y secret whs_. El voto contiene data.id, weight, created_at, expires_at, project y user.platform_id. Las páginas legacy y algunos ejemplos del SDK usan Authorization y otra forma de payload. No mezclar ambas recetas: elegir v1 para integración nueva, validar la versión efectivamente disponible y fijar el adaptador.

Fuentes: [webhooks](https://docs.top.gg/webhooks/overview), [eventos](https://docs.top.gg/webhooks/events), [proyectos](https://docs.top.gg/api/v1/projects), [ejemplo SDK con forma legacy](https://docs.top.gg/libraries/javascript).

## Contrato propuesto de recepción

POST /integrations/topgg/v1/votes recibe raw body limitado antes del parser JSON general. Verifica formato, longitud de digest, HMAC con comparación constante y antigüedad del timestamp (tolerancia propuesta 5min con reloj sincronizado); valida esquema, plataforma, tipo bot y applicationId esperado. Rechaza proyectos ajenos; userId es platform_id de Discord, no el ID interno de Top.gg. data.query no autentica usuario, guild ni recompensa.

Persistir recibo durable único (provider, eventType, voteId) y el trabajo en el mismo límite transaccional disponible. Si falla persistencia responder 5xx para reintento; si el evento válido ya existe responder 2xx. ACK válido antes del plazo documentado de 5s. webhook.test solo acredita conectividad/firma; nunca otorga premio. No dar 2xx a firmas inválidas para aparentar éxito.

La recompensa tiene ledger único por voto y beneficiario, con estado pendiente/aplicada/conciliación. Retry no duplica saldo ni duración. expires_at marca próxima elegibilidad según payload; no hardcodear el cooldown de una versión vieja. Política propuesta: recompensa cosmética o crédito acotado; votar no es requisito para moderación básica ni se simula una suscripción pagada. Mostrar peso/beneficio sin prometer equivalencias no definidas.

Estadísticas: un publicador líder agrega guilds de shards activos con generación/frescura y sin duplicar réplicas. No publicar el conteo local de cada VPS como total. La API v1 documenta PATCH /projects/:project_id/metrics con server_count/shard_count; project token usa @me y OAuth usa projectId, con autenticación y permisos correspondientes. Frecuencia propuesta con jitter y backoff según límites vigentes; no un POST por cada evento.

## Modelo comercial propuesto

| Oferta | Alcance | Funciones candidatas | Condición |
| --- | --- | --- | --- |
| Gratuito | Guild y usuario | controles musicales básicos, tickets/moderación esenciales, configuración y diagnóstico | Sin degradar corrección, privacidad o accesibilidad |
| OBEY Plus | Una guild | más plantillas, personalización y cuotas de funciones costosas | Precio/cuotas pendientes de costes medidos |
| Personal | Usuario | cosméticos y biblioteca personal ampliada | SKU opcional posterior; no compra permisos de admin |
| Apoyo | Donación voluntaria | agradecimiento definido sin confundir con compra de funciones | Revisar reglas del proveedor y Discord |

No fijar audio/fuentes premium sin derechos y capacidad demostrada. No cobrar por corregir autoplay, garantizar persistencia de un ticket existente o traducir un error esencial. Reservas y límites se validan en servidor en todas las entradas.

## Fuente de verdad de acceso

Billing mantiene customer, subscription, invoice/payment y eventos del proveedor. Entitlements mantiene subjectType user/guild, subjectId, feature/plan, source, externalId, startsAt, endsAt, revokedAt y revision. Membership/roles de Discord no son recibos de pago. Una guild no es el titular de la tarjeta; pagador y administradores tienen permisos distintos. Nunca devolver datos de facturación a cualquier miembro de la guild.

Resolver efectivo de derechos por tiempo, estado y origen: si vence una fuente pero queda otra vigente, el acceso continúa. No acumular dos cobros de Discord y web por un mismo beneficio sin advertirlo. Al cambiar de guild, revisar autoridad y reglas de transferencia, y registrar el cambio; no seleccionar el destino desde metadata controlada solo por frontend.

Estados normalizados: checkout_pending → requires_action/trial/active → past_due/grace → expired, con canceled_at_period_end que conserva acceso hasta endsAt. Refund/dispute/revocation tienen reglas explícitas y revisión del proveedor. Los nombres externos no se equiparan automáticamente entre proveedores. Evento atrasado no revive una suscripción revocada: consultar estado actual, versionar y conciliar.

## Web: recorrido y autorización

OAuth Discord en backend, sesión segura, state y CSRF; scopes mínimos. Elegir guild solo si usuario tiene autoridad actual y bot está instalado. Mostrar alcance, periodo, importe/moneda, impuestos cuando corresponda, renovación y cancelación antes del checkout hospedado. No capturar números de tarjeta en OBEY.

La página de regreso muestra «Estamos verificando el pago» hasta recibir confirmación autoritativa. Redirección success, captura del usuario o rol «Premium» no activan derechos. Webhook verificado y deduplicado actualiza billing/entitlements; un proceso reconcilia fallos y cancela datos obsoletos en caché. Permitir gestionar renovación, ver fecha final y contactar soporte con referencia no secreta.

## Discord Premium Apps y proveedor externo

Discord separa SKU, subscription y entitlement, incluidos ámbitos usuario/guild. La guía consultada de habilitación limita actualmente los desarrolladores a EE.UU., UE y Reino Unido, además de verificación/team/onboarding. La obligación de ofrecer beneficios equivalentes por Premium Apps y a precio no mayor aplica en la medida en que Discord soporte la región y tipo de oferta. Verificar de nuevo antes de lanzar, incluidos descuentos; no convertir esta investigación en aprobación comercial.

Fuentes: [overview](https://docs.discord.com/developers/monetization/overview), [habilitación](https://docs.discord.com/developers/monetization/enabling-monetization), [regla de soporte/paridad](https://support-dev.discord.com/hc/en-us/articles/23810643331735-Premium-Apps-Required-Support-for-Monetizing-Apps).

Stripe es un adaptador de referencia, no proveedor elegido ni cuenta disponible confirmada. Su lista global debe comprobarse para el país/entidad reales; por ejemplo, Paraguay no apareció en la lista consultada. No suponer que aceptar tarjetas internacionales implica poder abrir una cuenta comercial desde cualquier país. Evaluar proveedor local o merchant of record con soporte real, suscripciones, reembolsos, liquidación y contrato aplicable antes de elegir.

Fuentes: [disponibilidad](https://stripe.com/global), [suscripciones por eventos](https://docs.stripe.com/billing/subscriptions/webhooks), [firmas/reintentos](https://docs.stripe.com/events/manage-webhook-endpoints). Si se elige Stripe, usar su SDK con raw body y secreto de endpoint correcto; suscripción creada no equivale siempre a pago completado. El dominio OBEY normaliza estados y no depende de un único procesador.

## Aceptación mínima

Voto válido, firma alterada, body modificado, timestamp inválido, voto repetido, proyecto ajeno, evento test y caída de DB. Pago completado, requiere acción, webhook duplicado, eventos desordenados, cancelación al fin de periodo, reembolso, disputa, fuente alternativa vigente y pérdida de permisos de guild. No publicar el checkout hasta comprobar sandbox y conciliación; nunca usar datos de pago reales como prueba automatizada.
