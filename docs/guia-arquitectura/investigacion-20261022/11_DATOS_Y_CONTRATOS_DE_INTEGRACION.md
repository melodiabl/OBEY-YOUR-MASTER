# Datos y contratos de las capacidades nuevas

Propuesta adicional a los 32 módulos de base: src/modules/votes y src/modules/billing; resolver de acceso en src/shared/entitlements. No son tres bots ni tres bases nuevas. Reutilizar registro, jobs, Mongo y autorización existentes. Cada tabla aquí es un contrato objetivo; no se crearon colecciones ni índices en producción.

| Entidad | Clave / aislamiento | Estados y reglas |
| --- | --- | --- |
| voteReceipt | provider + eventType + externalVoteId único | received, processing, applied, reconciliation; identidad de proyecto verificada |
| rewardEntry | voteId + beneficiary + rewardPolicyVersion único | cantidad/duración acotada, causa, resultado; nunca conceder dos veces |
| billingEvent | provider + externalEventId único | recibido/verificado/procesado/error; retener payload mínimo y redacción |
| billingAccount | ID interno y customer externo por provider | pagador autenticado; datos privados fuera de guild settings |
| subscription | provider + externalSubscriptionId único | sujeto/plan, periodo y estado reconciliado; revisión y cancelación |
| entitlement | provider + grantId + feature + sujeto | user/guild explícito; startsAt/endsAt/revokedAt y source |
| guildConfiguration | guildId + moduleId único | borrador/publicado, schemaVersion y revision CAS |
| musicSession | guildId único | propietario, generation, playbackInstanceId y queueRevision |
| operationReceipt | scope + operationId único | intención, pasos, efectos, estado y referencia pública segura |

Índices por guild/sujeto y consultas deben incluir scope, no confiar solo en IDs recibidos del cliente. Antes de crear unique indexes detectar duplicados y migrarlos con checkpoint. No usar TTL de Mongo como expiración exacta: comprobar endsAt en la lectura de derechos; TTL solo limpia después.

Una escritura crítica confirma persistencia, no solo cache/SyncMap. Para Mongo con varios documentos, comprobar que el despliegue permite transacciones y probar abort/retry; no asumir réplica habilitada. Si no hay transacciones, diseñar agregado de un documento o intención/ledger idempotente con conciliación explícita. Publicar recibo y trabajo/outbox bajo el límite atómico elegido; no hacer un check seguido de insert sin índice único.

## Operaciones compartidas propuestas

| ID | Entrada confiable | Resultado | Quién la usa |
| --- | --- | --- | --- |
| votes.receive | evento ya autenticado, project y voteId | recibo durable; premio aún puede estar pendiente | webhook v1 |
| votes.applyReward | receiptId y policyVersion del servidor | aplicada una vez o conciliación | worker |
| votes.getStatus | actor autenticado, app esperada | elegibilidad/confirmación sin exponer otros usuarios | slash/botón/web |
| billing.createCheckout | actor, guild validada, offerId permitido y operationId | URL hospedada y recibo pendiente | web autenticada |
| billing.receiveEvent | proveedor autenticado y eventId | recibo procesable | webhook específico |
| billing.reconcile | referencia interna y estado actual del proveedor | revisión normalizada y grants | worker |
| entitlements.evaluate | sujeto autenticado, feature, instante confiable | allow/deny, límite y causa publicable | todos los módulos |
| operations.get | actor autorizado y receiptId | solo los detalles que puede ver | Discord/web |

No aceptar importe, moneda, usuario pagador, permisos, feature premium o duración arbitrarios del cliente. El servidor obtiene la oferta y calcula las reglas. Entitlements autoriza features, pero no reemplaza permisos Discord: una persona premium sigue sin poder cerrar tickets ajenos o administrar otra guild.

## Contrato de error

Errores estables propuestos: FEATURE_DISABLED, PERMISSION_DENIED, STALE_REVISION, RESOURCE_UNAVAILABLE, PAYMENT_PENDING, ENTITLEMENT_EXPIRED, SIGNATURE_INVALID y RECONCILIATION_REQUIRED. Traducir solo al presentar; SIGNATURE_INVALID no se expone con detalles criptográficos al usuario final. correlationId/receiptId sirven al soporte y no contienen tokens.

## Recuperación

Jobs son reintentables e idempotentes. Después de una caída, leer recibo y estado del proveedor antes de repetir efectos. Un envío de Discord puede haber ocurrido antes del fallo de respuesta: consultar/conciliar, no duplicar premios por repetir la notificación. Separar prioridad de controles, logs y trabajos de facturación para que una oleada de logs no retrase un ACK.
