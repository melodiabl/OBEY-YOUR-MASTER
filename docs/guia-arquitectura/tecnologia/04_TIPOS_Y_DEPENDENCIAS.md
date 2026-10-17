# Tipos, contratos y límites comprobables

## Adopción de tipos

Mantener CommonJS y archivos `.js` en la primera extracción. Añadir JSDoc a contratos de puertos, contexto y resultados; ejecutar TypeScript en el conjunto seleccionado. `allowJs` y `checkJs` permiten comprobar JavaScript [T1]. No afirmar cobertura total por incluir un tsconfig.

Un `include` pequeño no evita que TypeScript siga imports hacia legacy. Definir puertos tipados y adaptadores de frontera para evitar que la comprobación arrastre todo el cliente global. No usar `any` en todas las fronteras para lograr un resultado verde; registrar el motivo de cada escape temporal.

Separar parámetros externos de tipos internos. Los payloads HTTP y las opciones Discord comienzan como datos no confiables y se analizan en runtime. Un cast, una interfaz o un comentario JSDoc no valida una petición. Los DTO públicos se seleccionan, no se obtienen serializando un documento entero.

## Paso posterior a `.ts`

Solo después del piloto: decidir si el valor obtenido justifica migrar código nuevo a `.ts`. Si se aprueba, fijar `module`, resolución, salida, extensiones y estrategia para copiar assets/EJS. Comprobar tanto el ejecutable del contenedor como los scripts operativos antes de ampliar la conversión.

No mezclar en la misma etapa `.ts`, ESM, aliases y un cambio de framework. El soporte nativo de Node para TypeScript no comprueba tipos [T2]; esta propuesta no depende de que el runtime ejecute directamente todos los ejemplos TS.

## Reglas de imports

| Desde | Puede importar | Debe evitar |
| --- | --- | --- |
| Reglas/contratos de módulo | Valores propios y contratos estables del núcleo | Express, discord.js, Mongoose, cliente global |
| Caso de uso | Reglas y puertos declarados | Modelo de otro módulo, `req`, `interaction` |
| Adaptador HTTP/Discord | API pública del módulo y transporte | Escrituras directas a la colección de negocio |
| Repositorio | Modelo y helpers de persistencia necesarios | Render de mensajes o autorización de interfaz |
| Módulo A | API pública de B declarada en manifest | `B/internal`, schemas, cachés y handlers privados |
| Composición | Factories y adaptadores concretos | Reglas del negocio que pertenecen a módulos |
| Legacy | API pública migrada a través del adaptador | Nuevas dependencias de dominio hacia código legacy |

No toda llamada entre módulos exige un bus. Para pedir una concesión y necesitar resultado, usar un puerto directo. Para avisar que una publicación ocurrió, emitir un hecho posterior. Evitar ciclos por contratos compartidos pequeños; no mover todos los tipos de negocio a una carpeta común sin dueño.

## Cómo comprobar las reglas

dependency-cruiser admite reglas de dependencias y detección de ciclos [T5]. En la implementación definir reglas para: import no resuelto, ciclo del área migrada, entrada a internos ajenos y dependencia de dominio hacia transporte. Establecer las excepciones legacy por ruta concreta, propietario y motivo; no excluir todo `handlers/` para siempre.

La herramienta comprueba imports, no el flujo completo de datos, permisos, escrituras indirectas o dependencias dinámicas arbitrarias. Revisar `require` construido con strings y registros manuales. El manifest de dependencias necesita validación propia y comparación con las conexiones registradas.

Prohibir nuevos accesos al cliente global desde la lógica extraída. El uso legacy actual se mantiene hasta reemplazar sus consumidores. Una regla es útil cuando impide introducir otra dependencia equivocada sin exigir resolver toda la deuda previa.

## Contrato de API y versiones

Usar OpenAPI 3.1 como destino de documentación de rutas migradas [T6]. Es una elección de compatibilidad, no una afirmación de que sea la edición más reciente. Describir schemas, estados HTTP, seguridad y ejemplos de error; asignar operationId único.

La exportación de schemas no descubre automáticamente autorización, idempotencia o handlers. El registro de rutas deberá vincular esos elementos; una especificación vacía o generada de nombres de archivos no acredita la API.

No usar generación de clientes como requisito del primer piloto. Primero comprobar que la forma documentada coincide con la respuesta real. DTO web, evento y payload Discord pueden ser distintos aunque invoquen la misma operación.

## Cierre

Registrar ámbito comprobado, versión del compilador/herramienta, reglas activas, excepciones y resultado. Un error conocido fuera del ámbito no se presenta como error nuevo; un archivo no comprobado tampoco se presenta como correcto.
