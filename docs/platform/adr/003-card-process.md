# ADR 003: procesos de una tarjeta con presupuesto y cola acotada

Fecha: 2026-10-13. Estado: aceptada para bienvenida/despedida.

El decoder y el renderer de Canvas usan memoria nativa y pueden bloquear o abortar el proceso. Un timeout alrededor de una Promise no termina ese trabajo. Se ejecuta una tarjeta por proceso hijo, con protocolo IPC de datos y buffers, y el proceso se termina después de obtener la imagen. No se reutilizan workers: así no se acumulan caches o memoria retenida entre tarjetas ni se reparte incorrectamente un límite de CPU por vida del proceso.

El supervisor mantiene como máximo un proceso activo y cuatro trabajos esperando en este bot. La admisión ocurre antes de descargar medios; el trabajo que vence esperando o encuentra la cola llena permite entregar texto mediante la recuperación existente. El proceso hijo no recibe cliente Discord, credenciales, NODE_OPTIONS, URLs, rutas de usuario ni funciones. El padre y el hijo comprueban el DTO por separado; scripts, fuentes y marcos son rutas locales conocidas.

Linux/prlimit aplica ocho segundos de CPU y 384 MiB de RLIMIT_DATA por hijo, sin core dumps. Node limita el old space de V8 a 96 MiB; ese ajuste no limita toda la memoria del proceso ni todo el heap. El padre impone ocho segundos de tiempo transcurrido y vigila RSS a intervalos de 50 ms, terminando el hijo cuando supera 256 MiB. El límite de RSS es una vigilancia con posible exceso temporal entre muestras; RLIMIT_DATA no es un límite de RSS total. No se confunden los límites de V8 con la memoria nativa ni se usa RLIMIT_RSS, que no protege este caso en Linux moderno.

La cola espera hasta dos segundos. Preparar los medios tiene un plazo de 5,5 segundos, superior al plazo individual de descarga de cinco segundos; ocurre bajo el mismo cupo. Error, timeout, saturación y salida inesperada se devuelven como códigos sin datos privados. No se vuelve a renderizar automáticamente el mismo trabajo. Una salida tardía no restaura un resultado vencido ni abre un proceso después del cierre.

Los cupos solo se liberan tras confirmar que el hijo terminó. Si el sistema no confirma la terminación tras SIGKILL, se permite fallar la petición tras un segundo adicional, pero se conserva el cupo para impedir acumular procesos. Cerrar rechaza la cola, detiene procesos propios y espera de forma acotada. El código falla con recuperación a texto si la plataforma no dispone de los requisitos; no vuelve al decoder en el proceso del bot.

El Dockerfile incluye util-linux. Los requisitos se verifican con hijos locales y fixtures de bloqueo, crash, memoria, env, cola y cierre. No se afirma un sandbox de sistema de archivos/red: los procesos mantienen el UID del bot y pueden leer recursos locales; el aislamiento es de fallos y recursos. La ingestión HTTPS sigue en el padre bajo su política actual. No se inicia el bot, una cola externa ni otro cliente Discord para renderizar.

Fuentes: [Child process de Node 22](https://nodejs.org/download/release/v22.23.0/docs/api/child_process.html), [opciones de V8](https://nodejs.org/download/release/v22.23.0/docs/api/cli.html#--max-old-space-sizesize-in-mib), [getrlimit/prlimit](https://man7.org/linux/man-pages/man2/getrlimit.2.html). Los límites DATA/CPU/CORE se comprueban dentro de un hijo real, además de las pruebas de respuesta y recuperación.
