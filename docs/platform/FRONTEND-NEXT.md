# Migración del panel a Next.js

Decisión expresa del usuario, 23/10/2026: Next.js con React y TypeScript. La migración se realiza por pantalla y conserva la identidad y las fuentes de OBEY. No cambia la autoridad de la cola musical ni sustituye los servicios del bot.

## Primera pantalla

`/app/` incorpora selector de servidores administrables con OBEY, estado musical en vivo, cola de las cinco siguientes canciones, pausa/reanudación, anterior, siguiente, detener y volumen. Configuración, bienvenida, registros, biblioteca, ayuda y reproductor completo enlazan sus recorridos existentes; esas pantallas siguen usando EJS. La landing continúa en `/`.

El paquete aislado `dashboard/frontend` fija Next 16.4.3, React/React DOM 19.3.1, TypeScript 5.9.3 y Socket.IO Client 4.8.3 en su propio lock. No instala React ni Next entre las dependencias del proceso del bot. Node mínimo del paquete: 22.12.0.

Next genera una exportación estática bajo `/app`. Express entrega el HTML después de comprobar la sesión y solo expone los archivos compilados de `_next`; no sirve el directorio fuente. El Dockerfile compila el frontend en una etapa y copia únicamente `out` a la imagen final. CI usa ese mismo build. El runtime sigue siendo un único proceso del bot/Express, sin servidor Next adicional.

Esta elección permite migrar componentes y rutas de manera gradual sin duplicar OAuth, sesiones o servicios. No usa Server Actions, SSR por solicitud ni rutas API de Next. Si una pantalla requiere esas funciones, habrá que revisar el despliegue antes de incorporarlas. [Exportación estática de Next](https://nextjs.org/docs/app/guides/static-exports), [raíz de Turbopack](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack#root-directory).

## Autenticación y estado

- `/api/panel/context` exige sesión, vuelve a consultar los permisos de Discord y comprueba que la sesión siga vigente. Devuelve solo identidad pública, servidores administrables presentes en el bot y el valor CSRF de la sesión; nunca tokens OAuth, configuración de nodos ni credenciales.
- Si Discord falla no se reutiliza la lista antigua como autorización. OAuth acepta únicamente el retorno fijo `/app`, conservando la regeneración de sesión existente. Las respuestas privadas no se almacenan en caché compartida.
- Lectura y controles musicales reutilizan las API y Socket.IO existentes. Los POST mantienen CSRF y la comprobación fresca de permisos del backend. No hay segundo player ni cola local.
- Cambiar de servidor aborta la lectura y elimina la suscripción anterior. Revisiones antiguas se ignoran; una revocación borra los datos y bloquea respuestas tardías hasta verificar de nuevo. Las acciones no se reintentan automáticamente, y los controles se bloquean durante su confirmación o desconexión.
- El avance de tiempo parte de la posición y velocidad del snapshot del servicio, con interpolación local entre actualizaciones. No modifica el reloj musical canónico ni promete corregir la latencia del proveedor.

## Desarrollo y compilación

Desde la raíz:

```sh
npm ci --prefix dashboard/frontend --ignore-scripts
npm run web:typecheck
npm run web:build
```

El arranque normal del bot sirve el resultado en `/app/`. `npm run web:dev` abre Next en `127.0.0.1:3204`, con proxy al backend `127.0.0.1:3002`; `OBEY_DASHBOARD_ORIGIN` permite cambiar ese destino solo para desarrollo. Para probar OAuth local, el backend y Discord deben tener configurado el callback de ese entorno. No copiar credenciales de producción al frontend ni usar variables `NEXT_PUBLIC_*` para secretos.

## Verificación y siguientes pantallas

La aceptación de esta unidad comprende compilación limpia local y Docker, tipos, pruebas originales, autorización HTTP/CSRF, descarte de revisiones antiguas, navegador con desconexión/revocación/cambio de servidor y disposición a 1440/768/320 px. Las comprobaciones usan un servidor local aislado y no una cuenta Discord real; la aceptación OAuth autenticada y la escucha real siguen pendientes del recorrido del usuario.

El siguiente recorrido web es configuración/bienvenida, reutilizando el contrato y servicio actuales; después biblioteca/Me gusta y reproductor completo. No cerrar T10/T16/T17 globalmente con esta pantalla ni dar por migrado todo EJS. La migración musical a lavalink-client, setups y logs conservan sus pendientes en el plan maestro.

La evidencia de verificación y el resultado operativo se registran en `evidence/frontend-next-20261023.json` y en el checkpoint vigente. Los verificadores temporales se retiran al cerrar la entrega, conservando los tres archivos originales de tests.
