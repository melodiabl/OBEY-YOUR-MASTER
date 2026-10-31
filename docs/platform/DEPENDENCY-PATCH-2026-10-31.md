# Dependencias · follow-redirects 1.16.2

La auditoría nativa previa al despliegue notificó GHSA-mrwp-f3q8-3g9p, alta, en follow-redirects 1.16.1. Se actualizó exclusivamente esa entrada del lock a 1.16.2, con su URL e integridad; package.json y las versiones de los demás paquetes permanecen iguales. La dependencia llega por Axios y skia-canvas/captcha-canvas.

El [aviso revisado](https://github.com/advisories/GHSA-mrwp-f3q8-3g9p) identifica 1.16.0–1.16.1 como afectadas y 1.16.2 como corregida. Describe la pérdida de sensitiveHeaders cuando el array viene de otro realm. No se afirma explotación de OBEY ni impacto demostrado de Axios: el propio aviso distingue ese caso y sus condiciones.

Dos pruebas con servidores HTTP de loopback y cabeceras exclusivamente sintéticas verifican que la cabecera personalizada marcada como sensible se elimina al cambiar de destino y que una cabecera ordinaria se conserva. Se comprueba tanto un array del mismo realm como uno de node:vm. No se enviaron credenciales reales ni solicitudes a servicios externos en esas pruebas. En imagen pasan los mismos dos casos y se verifica 1.16.2 instalado, además del hash del lock.

La auditoría posterior pasa de 50 moderadas/1 alta a 50 moderadas/0 altas/0 críticas. Las moderadas siguen pendientes de su trabajo propio; no se bajó su severidad ni se aplicó audit fix --force. Este parche se incluye en la imagen de retirada de las consolas del dueño, con despliegue, respaldo y reversión documentados en esa entrega.
