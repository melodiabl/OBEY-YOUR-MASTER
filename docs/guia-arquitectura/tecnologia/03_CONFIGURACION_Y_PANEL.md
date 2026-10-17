# Configuración declarativa y fácil de usar

Propuesta para extender el patrón actual de borrador/publicación. Un administrador configura valores y recursos; el desarrollador define contratos y reglas. El administrador no escribe expresiones JS ni administra dependencias.

## Fuente canónica

Para cada operación nueva, el contrato Zod define forma y límites estructurales. La descripción de UI referencia campos de ese contrato y añade agrupación, orden, componente y claves de ayuda. Las políticas verifican permisos, pertenencia a la guild y disponibilidad real. Los DTO de salida tienen allowlist propia.

Ejemplo de contrato de referencia para el piloto; no está instalado ni sustituye todavía `validatePatch`:

```js
const { z } = require('zod')

const WelcomeConfig = z.strictObject({
  channelId: z.string().regex(/^[a-zA-Z0-9_:-]{1,100}$/).nullable(),
  message: z.string().max(500),
})

// Conservar forma y precedencia legacy en el adaptador inicial.
// La política de servidor debe resolver y verificar el canal real.
const WelcomeDraftInput = z.strictObject({
  config: WelcomeConfig,
  expectedDraftRevision: z.number().int().nonnegative(),
  expectedPublishedRevision: z.string().regex(/^[a-f0-9]{64}$/),
})

const welcomeUi = {
  sections: [{
    id: 'delivery', titleKey: 'welcome.settings.delivery',
    fields: [
      { path: 'channelId', component: 'guild-text-channel',
        labelKey: 'welcome.settings.channel', options: 'welcome.channels' },
      { path: 'message', component: 'message-template',
        labelKey: 'welcome.settings.message', helpKey: 'welcome.settings.variables' },
    ],
  }],
}

module.exports = { WelcomeConfig, WelcomeDraftInput, welcomeUi }
```

El regex conserva la forma sintáctica existente; no prueba que sea un ID Discord válido. El resolver obtiene recursos autorizados y la política revalida al publicar. Estrechar el contrato legacy requiere inventario y decisión de compatibilidad.

Zod ofrece conversión a JSON Schema, pero ciertos tipos o transformaciones no son representables [T4]. Restringir los contratos de formularios a JSON serializable y al subconjunto exportable. Un refinamiento personalizado puede no convertirse en restricción del formulario: la política y el contrato servidor siguen siendo autoridad. No usar `unrepresentable: 'any'` para esconder diferencias. Los metadatos no deben sobrescribir `type`, límites u otras restricciones generadas.

## Qué genera y qué requiere código

| Elemento | Fuente | Tratamiento |
| --- | --- | --- |
| Campos, tipos, límites simples y obligatorios | Contrato exportado | Proyección a controles permitidos |
| Orden, agrupación, ayudas, visibilidad | Descriptor UI | Validar referencias; condiciones declarativas allowlist |
| Lista de canales o roles | Resolver registrado en servidor | Consulta autorizada y paginada; no URL arbitraria del descriptor |
| Revisión y conflicto | Caso de uso + repositorio | CAS, respuesta con estado actual permitido |
| Permisos y jerarquía de roles | Política de dominio/proveedor | Revalidar al aplicar; no confiar en control oculto |
| Tarjeta, cola musical o editor de plantilla | Componente especializado | Reutilizar renderer/motor; no forzar todo a inputs genéricos |
| Mensajes y ayuda | Catálogo es/en | Escapar valores y conservar variables permitidas |

JSON Schema no genera por sí solo la experiencia completa. El renderer de formulario de OBEY debe implementarse y verificarse. No se ha elegido un generador externo de React para una aplicación EJS.

## Recorrido del administrador

1. Elegir servidor y ver qué módulos están configurados, desactivados o degradados.
2. Abrir una capacidad y cargar configuración publicada y borrador por separado.
3. Elegir recursos existentes del servidor o dejar sin configurar. Crear recursos es una operación distinta con permisos y resumen propios.
4. Editar con ayuda por campo y selección de variables; mostrar cambios pendientes y errores junto al control.
5. Guardar borrador con revisión. Confirmar que guardarlo no modifica la función activa.
6. Ver preview sintético claramente identificado y diff contra la publicación vigente.
7. Publicar con revalidación de recursos, permisos y revisiones. Mostrar recibo y momento confirmado.
8. Ante conflicto, conservar lo escrito y ofrecer comparar/recargar. No sobrescribir automáticamente los cambios de otro gestor.

Distinguir restaurar defaults del formulario, descartar borrador y restaurar una publicación previa. Restaurar una versión es una nueva publicación auditada; nunca reponer silenciosamente campos que ya no son compatibles.

## Estados y accesibilidad

Cada control tiene label, ayuda asociada y error programáticamente vinculado. Al fallar, dirigir foco al resumen o primer campo inválido; no borrar valores. Los estados se comunican con texto, no solo color. Teclado, foco visible, contraste y tamaño usable deben comprobarse sobre la UI implementada.

Mientras se publica, deshabilitar repetición accidental de la acción, conservar un identificador para el reintento de la misma operación y permitir consultar su estado. Si se revoca acceso, dejar de entregar datos y limpiar contenido privado en la vista; ocultar el botón no basta.

## Valores y defaults

Ausente significa no enviado; `null` significa desconfigurar cuando el campo lo permita; `false` y `0` son valores. No usar `value || default` indiscriminadamente. Aplicar defaults al alta o a una acción explícita, no al publicar un patch incompleto.

El piloto conserva `welcome.channel/msg/message`, `welcomeChannel` y `welcomeMessage` mediante el escritor actual. No guardar el formulario entero como documento nuevo ni borrar imagen, DM, captcha o segundo canal por no estar en la primera pantalla.

## Preview y publicación

El preview de texto actual utiliza un fixture y no envía una bienvenida real. Mantener esa separación. Una prueba con un miembro real y una tarjeta es otra operación, con audiencia y límites definidos. Nunca permitir que el preview publique accidentalmente, mencione everyone o acceda a datos privados no autorizados.

El control de versiones tiene tres ejes: versión del contrato, revisión del borrador/publicación y versión del código. No usar un solo contador para los tres.
