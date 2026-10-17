# Cómo editar y extender OBEY

Procedimientos objetivo para una persona o IA. Aplicarlos al código migrado; mientras una capacidad siga legacy, registrar su ubicación real en la ficha del módulo. No inventar que ya existen las rutas `src/modules/*`.

## Quién puede cambiar qué

| Cambio | Lugar objetivo | Responsable |
| --- | --- | --- |
| Canal, rol, texto o comportamiento configurable de un servidor | Panel del módulo o comando de configuración | Gestor con permiso revalidado |
| Texto predeterminado de la aplicación | `locales/es.json` y `locales/en.json`, con clave del módulo | Desarrollador/editor del proyecto |
| Icono/emoji Discord | Registro de assets existente y mapping con IDs reales | Mantenedor autorizado del catálogo |
| Disposición del formulario | Descriptor UI y componentes EJS compartidos | Desarrollador de interfaz |
| Límite o campo de configuración | Contrato, política y mapping legacy del módulo | Desarrollador de capacidad |
| Nueva operación | Servicio público y adaptadores necesarios | Desarrollador de capacidad |
| Proveedor o almacenamiento | Adaptador que cumple el puerto | Mantenedor de infraestructura |
| Token, URI o credencial | Entorno privado de ejecución | Operador; nunca formulario público o catálogo |

## Receta: añadir un campo a bienvenida

1. Confirmar que el campo está aprobado y no existe con otro nombre. Documentar fuente, tipo, audiencia y conducta de ausente/null/false.
2. Añadirlo al contrato del módulo y a la respuesta permitida cuando corresponda. Los campos legacy de render no se borran porque no estén en el formulario.
3. Decidir dónde vive: nueva clave dentro del documento propietario o mapping compatible. Definir el efecto sobre revisiones; no copiar todo GuildSchema.
4. Añadir descriptor del control y claves es/en. Elegir un componente ya existente; si requiere uno nuevo, definir estados y accesibilidad.
5. Incorporar la política de recursos si es canal, rol, imagen o referencia externa. Ningún selector reemplaza esta validación.
6. Conectar adaptadores ofrecidos a la misma operación; no añadir un segundo validador manual para slash.
7. Comprobar valor válido, campo extraño, ausencia, desconfiguración, conflicto y pérdida de permiso. No hace falta restaurar las herramientas retiradas.
8. Registrar compatibilidad y rollback. Si implica datos nuevos, demostrar lectura del estado anterior sin escritura masiva silenciosa.

## Receta: comando y botón para una acción existente

Definir la acción pública una vez; ambos adaptadores construyen input y contexto confiable. Cada superficie resuelve su propia audiencia y respuesta. Mantener IDs/aliases actuales hasta migrar consumidores. Un customId identifica acción y entidad/revisión cuando haga falta; nunca transporta permisos ni secretos confiables.

El botón debe revalidar recursos y actor al pulsarse. Si venció, responder con estado explicable y una forma de abrir el recurso vigente. El comando no debe omitir la revisión si esa acción requiere controlar concurrencia. La paridad se comprueba por efecto y autorización, no por compartir etiquetas.

## Receta: cambiar mensajes y emojis

Agregar una clave del módulo y variables permitidas. Reutilizar el traductor actual y sus catálogos; separar texto de usuario del texto propio. Comprobar fallback, interpolación y límites de Discord.

Para emojis, usar la clave semántica del registro existente y el tipo de campo adecuado. Conservar fallback legible y la política del panel sin catálogo decorativo. No registrar IDs ficticios ni subir archivos como consecuencia implícita de editar una traducción.

## Receta: añadir una capacidad nueva

Primero aprobar alcance y confirmar que no existe servicio equivalente. Después crear el módulo mínimo con dueño, contrato, API pública, persistencia, recursos, dependencias y política de desactivación. Registrar solo las entradas necesarias y conectar un recorrido completo. Una capacidad sin comportamiento implementado figura como pendiente, sin controles que simulan funcionar.

El generador de módulos, si se implementa, crea estructura y metadatos pendientes; no registra comandos globales, crea canales, sube emojis o inicializa bases por ejecutarlo. No instalar una CLI adicional antes de que dos migraciones demuestren qué plantilla se repite.

## Receta: cambiar proveedor

Definir capacidades mínimas del puerto, límites y traducción de errores. Ejecutar la misma comprobación contractual con el adaptador actual y el nuevo; seleccionar en composición por configuración operativa permitida. No publicar URLs privadas o claves en DTO.

En música conservar propietario de sesión y política de recuperación al cambiar nodos/proveedores. No llamar a dos motores en paralelo para comparar reproducción real. En tarjetas usar fixtures sintéticos y límites del worker.

## Instrucción reusable para la IA

> Antes de editar, lee la ficha del módulo, su API pública y sus consumidores. Identifica la fuente canónica de cada regla. Implementa el cambio en esa fuente y adapta las entradas sin duplicar negocio. Conserva aliases, datos y recursos compatibles. Entrega comportamiento observado, archivos, verificación real, límites y rollback. Si el cambio exige editar validadores equivalentes en varias superficies, revisa primero la frontera del módulo.
