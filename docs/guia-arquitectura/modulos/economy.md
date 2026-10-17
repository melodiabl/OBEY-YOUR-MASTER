# Guía de migración del módulo economy

Tarea `MOD-ECONOMY`. Estado `audit_before_migration`. Destino propuesto `src/modules/economy`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

- `commands/Economy/balance.js`
- `commands/Economy/bank.js`
- `commands/Economy/beg.js`
- `commands/Economy/blackmarket.js`
- `commands/Economy/buy.js`
- `commands/Economy/coinflip.js`
- `commands/Economy/crime.js`
- `commands/Economy/daily.js`
- `commands/Economy/deposit.js`
- `commands/Economy/dice.js`
- `commands/Economy/ecohelp.js`
- `commands/Economy/ecolb.js`
- `commands/Economy/hourly.js`
- `commands/Economy/inventory.js`
- `commands/Economy/items.js`
- `commands/Economy/monthly.js`
- `commands/Economy/pay.js`
- `commands/Economy/profile.js`
- `commands/Economy/rob.js`
- `commands/Economy/sell.js`
- `commands/Economy/slots.js`
- `commands/Economy/storeinfo.js`
- `commands/Economy/transfer.js`
- `commands/Economy/weekly.js`
- `commands/Economy/withdraw.js`
- `commands/Economy/work.js`
- `database/schemas/EconomySchema.js`
- `handlers/economy/messages.js`
- `slashCommands/Economy/balance.js`
- `slashCommands/Economy/coinflip.js`
- `slashCommands/Economy/daily.js`
- `slashCommands/Economy/depositar.js`
- `slashCommands/Economy/pay.js`
- `slashCommands/Economy/retirar.js`
- `slashCommands/Economy/rob.js`
- `slashCommands/Economy/work.js`

Mensajes/schema/comandos existen en el árbol. Comprobar las escrituras y transacciones reales antes de declarar ledger, stock o entrega consistente.

## Recorrido objetivo y permisos

Miembro opera saldo propio; gestor define moneda/tienda sin inventar fondos.

1. Consultar saldo por guild.
2. validar cooldown/stock/precio.
3. reservar operación.
4. transacción ledger/saldo/inventario.
5. confirmar compra/daily.
6. entregar rol/cosmético.
7. mostrar resultado.

## Fuente de verdad y límites

Account, LedgerEntry, Purchase, Fulfillment y StoreItem; transacción Mongo o alternativa probada

Economía por servidor; saldo público solo opt-in. XP no es moneda; rol premio no es evidencia de saldo. Transferencias apagadas inicialmente.

Ledger conserva origen/destino/comisión; reintento no cobra dos veces. Fallo entrega conserva compra pagada y fulfillment pendiente con recuperación, no éxito total.

## Pasos concretos de reorganización

1. Relacionar cada entrada real con una acción de negocio. Leer los archivos candidatos y completar referencias adicionales; esta lista no es un grafo exhaustivo.
2. Identificar la colección o estado propietario y los efectos externos de esa acción. Registrar todo acceso directo que deba migrar.
3. Extraer el caso de uso pequeño y sus políticas. Si ya hay un servicio, adaptarlo; no crear otro con nombre distinto.
4. Hacer que una entrada delegue y comprobar permiso, efecto y respuesta. Migrar las demás superficies ofrecidas, conservando aliases y customIds.
5. Mantener un adaptador legacy hasta no encontrar consumidores. Aislar el acceso al cliente global detrás de ese adaptador cuando sea necesario.
6. Separar cambios de archivos y cambios de datos. Si hace falta migración, escribir mapping, checkpoint, lectura compatible y rollback antes de ejecutar.
7. Retirar lógica vieja con evidencia de referencias y recorrido; no eliminarla por tener una carpeta nueva.

## Configuración objetivo por conciliar

Campos de diseño de los contratos anteriores. No son claves runtime confirmadas: registrar clave legacy, tipo real, valor existente y fuente canónica antes de adaptarlos. Preservar ausente, null y false como estados distintos.

| Campo | Tipo | Default de diseño | Regla del contrato |
| --- | --- | --- | --- |
| currencyName | string | créditos | 1–24 caracteres |
| dailyAmount | int | 100 | 1–100000; solo nuevo servidor |
| dailyCooldownHours | int | 24 | Intervalo móvil, no medianoche local |
| transferEnabled | boolean | false | Habilitación explícita |
| transferFeeBps | int | 0 | 0–2000; comisión con cuenta destino |
| startingBalance | int | 0 | No saldo negativo |
| storeItems | lista | [] | Precio entero positivo,stock nullable,fulfillment role/cosmetic |
| messageCurrencyEnabled | boolean | false | XP y moneda independientes |
| scope | enum guild | guild | Sin economía global |
| seasonMode | enum none,leaderboard | none | Ranking separado; no resetear saldo |

## Casos de aceptación escritos

### economy FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo economy.

Cuando Consultar saldo por guild y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; mostrar resultado.

### economy RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando Dos compras compiten por el último artículo disponible.

Entonces Una transacción consume stock y cobra; la otra no cobra y devuelve agotado.

### economy RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Ledger conserva origen/destino/comisión; reintento no cobra dos veces. Fallo entrega conserva compra pagada y fulfillment pendiente con recuperación, no éxito total.

### economy PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. Economía por servidor; saldo público solo opt-in. XP no es moneda; rol premio no es evidencia de saldo. Transferencias apagadas inicialmente.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.
