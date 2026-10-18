# API y dependencias de configuración de bienvenida · TECH-06 parcial

Incremento local del 18/10/2026 sobre `dc78d01`. API pública e imports del piloto de canal/mensaje; no migra la entrega completa de welcome ni cierra TECH-05/ARCH-04 globales. [Evidencia y SHA](../platform/evidence/welcome-api.json).

## Entrada pública y composición

Importar explícitamente `handlers/welcome/index.js`. Existe un `handlers/welcome.js` legacy: `require('./welcome')` elige ese archivo antes que la carpeta. La entrada pública exporta las mismas referencias existentes, sin otro escritor o runtime:

| Exportación | Uso |
| --- | --- |
| `createWelcomeService` | Composición: inyecta repositorios, política y compuerta de cierre |
| `ConfigurationError` | Adaptadores: identidad compartida, código, campos y revocación |
| `configSchema`, `configJsonSchema` | Contrato de los dos campos y restricciones de presentación |
| `welcomeSettingsForm` | Presentación EJS traducida es/en |

La instancia `client.welcomeConfiguration` conserva `read`, `readPublished`, `channels`, `saveDraft`, `preview`, `publish`, `savePublished`, `drain` y `lifecycleState`. Contexto separado `{ guildId, actorId }`, resuelto por el adaptador, y validación runtime de inputs. Puertos de persistencia en `handlers/welcome/ports.d.ts`; el servicio recibe datos, no `req`, interacciones ni el cliente completo. El [cierre de admisión y drenaje](CICLO_DE_VIDA_BIENVENIDA.md) conserva sus límites.

## Reglas activas

`npm run dependencies:welcome` usa dependency-cruiser **18.6.0**, fijado como dependencia de desarrollo, con [configuración persistente](../../.dependency-cruiser.cjs). CI ejecuta tipos e imports después de instalar y antes de los tests originales. Se mantiene Node 22 y no se añade ningún script auxiliar o archivo de tests.

El comando recorre `handlers`, `dashboard`, `slashCommands` y `commands`, siguiendo sus imports estáticos. Las reglas validan el área migrada y sus consumidores; no declaran correcto todo el legacy. Son errores: import no resuelto o ciclo del piloto, dependencias de dominio ajenas a sus puertos/helpers admitidos, acceso del dominio a UI/entrada pública, imports privados desde consumidores, dependencias ajenas de UI/fachada y acceso de los adaptadores incluidos a los repositorios conocidos.

Excepciones concretas y propietarios:

| Archivo/área | Dependencia admitida | Motivo |
| --- | --- | --- |
| Dominio `handlers/welcome/*`, excepto UI/fachada | Archivos propios, Zod y `handlers/welcome-message.js` | Contrato propio y formatter puro existente |
| `handlers/welcome/ui.js` | Contrato y `handlers/i18n/index.js` | Restricciones y traducciones existentes |
| `handlers/welcome/index.js` | service, error, contract y ui | Exportaciones públicas explícitas |
| `handlers/welcome-configuration.js` | contract y error internos | Repositorio CAS propietario del mapping/validación legacy |
| `handlers/configuration.js` | Repositorios y política concretos | Raíz de composición; usa la entrada pública para el piloto |

El formulario general y `setup-welcome` conservan operaciones avanzadas legacy además de delegar los dos campos incluidos. No se impone sobre ellos una prohibición general de stores que atribuya una migración no realizada. Las reglas de imports tampoco prueban flujo de datos, escrituras indirectas, cliente global por acceso dinámico o `require` calculado. No se usa una baseline que silencie infracciones del piloto.

## HTTP documentado

[OpenAPI 3.1.1](../api/welcome.openapi.json) describe cinco rutas existentes, sus cuerpos, DTO, seguridad, códigos y revisiones. El manifest ahora enumera también channels y preview; no añade endpoints ni comandos.

| Método y sufijo de `/api/guilds/{guildId}/modules/welcome` | Servicio | Resultado |
| --- | --- | --- |
| GET `/config` | `read` | Publicación, borrador y último recibo |
| GET `/channels` | `channels` | Canales de texto visibles para el actor |
| PUT `/draft` | `saveDraft` | Snapshot; borrador sin activar |
| POST `/preview` | `preview` | `{ fixture: true, content }` sintético, sin enviar |
| POST `/publish` | `publish` | Snapshot confirmado con recibo |

Identidad desde la cookie de sesión OAuth existente; ManageGuild revalidado, guild desde ruta y CSRF de sesión en `x-csrf-token` para escrituras. No se acepta actor o permisos en el body. El selector solo garantiza visibilidad del actor; publicar revalida además acceso y permisos del bot.

Errores documentados: 400 contrato inválido, 401 sesión ausente/vencida, 403 permisos/CSRF, 404 recurso inexistente, 409 conflicto con snapshot vuelto a autorizar y 503 indisponibilidad. Solo una revocación confirmada del actor lleva `accessRevoked: true`. Middleware de permisos puede devolver su mensaje de error legacy; el contrato no inventa un código nuevo. El parser global puede responder con texto/HTML antes del adaptador ante JSON malformado.

Guardar borrador usa revisiones CAS; no promete reintentos transparentes tras perder una respuesta. Publicar exige `operationId`, borrador y revisión esperada: el replay conserva actor e intención y solo está cubierto por el último recibo retenido. Tras un timeout consultar `/config` antes de reintentar. No hay historial ilimitado ni garantía de respuesta durante un cierre forzado.

El contrato OpenAPI registra fechas serializadas como texto ISO y config sin campos privados del documento Mongo. `enabled` puede proceder de DM/segundo canal legacy; no equivale a canal principal configurado. El límite en servidor usa unidades UTF-16; JSON Schema cuenta puntos Unicode y puede admitir un texto con emojis que Zod rechace antes de 500 puntos. Esto está declarado en la especificación.

Las rutas compatibles `/api/config/:guildId/welcome`, `/dashboard/:guildId`, SSR del editor, listado de manifests y slash/prefix siguen existentes y quedan fuera de esta especificación HTTP. No se publica Swagger UI ni un endpoint de descubrimiento adicional.

## Comprobaciones y límites

- Grafo real: 1.020 módulos y 3.197 dependencias detectadas; cero infracciones de las reglas activas.
- Diez mutaciones temporales: transporte, almacenamiento, import inexistente, ciclo, UI desde dominio, entrada privada, repositorio desde adaptador, ampliación de excepción, proveedor desde UI y desde fachada. Todas detectadas; reporter `err` devuelve exit 1 como necesita CI. Archivos restaurados byte a byte.
- Identidad de factory, clase de error, schemas y formulario comprobada; adaptadores HTTP, política y slash cargan sin ejecutar el handler legacy de bienvenida.
- OpenAPI validado contra el schema oficial de OpenAPI 3.1; schemas de entrada comparados con Zod, expandiendo las referencias de configuración.
- Mongo aislado y HTTP reales: 20 respuestas y entradas exitosas validadas con JSON Schema 2020-12, incluyendo fechas y DTO. Cinco rutas contrastadas con Express y manifest; CAS, replay, actor falsificado, permisos revocados, CSRF, sesión, recursos, proveedor no disponible y admisión cerrada. La revisión publicada sigue en 1 tras replay; DM y ajustes avanzados conservados. Actor/proveedor Discord y sesión simulados, sin OAuth/Gateway reales.
- `npm test`: 25/25 originales; `typecheck:welcome`, imports, sintaxis y diff pasan. Instalación limpia aislada `npm ci --ignore-scripts` y smoke de la CLI pasan; no certifica build de addons nativos o nueva imagen. Se preservan todos los registros de paquetes preexistentes del lockfile; 33 entradas nuevas solo de desarrollo. Acorn runtime 8.16.0 conservado; la herramienta usa su Acorn 8.19.0 anidado.
- Auditoría del lockfile: sin avisos atribuidos a los paquetes de desarrollo añadidos; quedan 36 avisos moderados preexistentes, sin correcciones ajenas al alcance.

Solo quedan JSON/Markdown de evidencia y configuración de la herramienta, sin restaurar verificadores auxiliares/tests permanentes. La base creada vacía, servidor HTTP y conexiones de prueba se retiraron; las carpetas temporales de instalación se eliminaron. Hubo intentos incompletos corregidos (resolución del nombre legacy, exports privados del paquete y metadato `$schema` al comparar schemas); no se cuentan como comprobaciones exitosas.

CI ejecutará tipos e imports al publicar la rama; no se ha ejecutado GitHub Actions en remoto. OpenAPI se contrastó temporalmente: todavía no existe un check persistente de deriva documental. No se hizo recorrido visual porque no cambió el editor; no se probó arranque completo, imagen, cierre real del proceso o producción. TECH-06 queda implementado para imports y estas cinco rutas del piloto; el resto de API, manifests entre capacidades y contratos legacy sigue pendiente. TECH-07 requiere elegir y conciliar una segunda capacidad, sin crear esqueletos masivos.

Reversión: revertir el commit de límites y reinstalar el lockfile anterior. La documentación es independiente; no hay cambios de esquema, migraciones ni datos que eliminar. Sin publicación remota ni despliegue; motor musical y nodo privado conservados.

Fuentes primarias: [reglas de dependency-cruiser 18.6.0](https://github.com/sverweij/dependency-cruiser/blob/v18.6.0/doc/rules-reference.md), [opciones](https://github.com/sverweij/dependency-cruiser/blob/v18.6.0/doc/options-reference.md), [OpenAPI 3.1.1](https://spec.openapis.org/oas/v3.1.1.html) y [schema oficial 3.1](https://spec.openapis.org/oas/3.1/schema/2022-10-07).
