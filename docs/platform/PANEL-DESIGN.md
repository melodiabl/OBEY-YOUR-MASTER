# Rediseño del panel

El usuario pidió corregir la tipografía y rediseñar el panel completo con referencias visuales. El diagnóstico en Chromium mostró Genta aplicada a marca/títulos, DM Sans al texto, Space Grotesk en otras cabeceras y Hanken Grotesk en música. Dos temas globales y estilos propios sobrescribían fuentes, colores y espaciado.

## Dirección

Panel de administración de comunidades Discord. Base grafito `#161923`, navegación `#11141c`, superficie `#1e222e`, borde `#353b4b`, texto `#f1f3f9`, azul de acción Discord `#5865f2`. Una única familia DM Sans local, regular/bold; título 28–32 px, sección 18 px, cuerpo 15 px y ayuda 13 px. Números tabulares sin fuente decorativa. Interfaz alineada a la izquierda y espacios de 4/8/12/16/24/32 px.

La identidad se expresa en la marca OBEY y en herramientas de comunidad. Navegación persistente con el servidor actual y accesos a configuración, bienvenida, tarjetas, Architect, música, biblioteca, estadísticas y ayuda. Los formularios conservan sus contratos y controles; el diseño da prioridad a las acciones y al contenido editado. Selector de servidores con búsqueda local, estado de instalación y acceso claro. Música conserva su espacio de escucha con la misma tipografía y superficies.

Se revisaron las páginas públicas de [MEE6](https://mee6.xyz/dashboard) (redirige al login) y [Carl-bot](https://carl.gg/), junto al flujo de configuración documentado de [Dyno](https://docs.dyno.gg/en/dashboard/settings). Dyno bloqueó la captura con Cloudflare; no se inspeccionaron dashboards privados ajenos. Se toman claridad de títulos y agrupación por funciones como referencias, sin copiar marca, ilustraciones ni simular funciones.

## Verificación prevista

Capturas antes/después, fuentes e iconos cargados localmente con recursos externos bloqueados, páginas representativas a 320/768/1024/1440 px y zoom, nombres largos, estados vacíos y errores, búsqueda de servidores, enlaces contextuales, teclado y cierre/foco del menú móvil. Regresiones de Tarjetas, configuración y ayuda con sus fixtures reales existentes. La landing pública conserva su diseño. No se declara conformidad WCAG completa ni recorridos OAuth reales mediante fixtures.

## Implementación y resultados

Una única base en `style.css` sustituye los temas superpuestos; `fonts.css` sirve DM Sans desde los archivos locales existentes. Los iconos Font Awesome 6.5.1 y Chart.js 4.4.0 se distribuyen localmente con sus licencias; el hash SHA-384 de Chart.js coincide con el SRI que ya exigía la página. El lector de estadísticas espera las fuentes antes de dibujar y acota el tamaño de las gráficas. Las páginas musicales usan la misma tipografía y superficies mediante su tema de escucha; conservan sus controles y APIs.

La navegación muestra el servidor elegido y la página activa. En móvil, el menú cerrado queda fuera del foco mediante inert; al abrirlo, se bloquea el fondo, Tab permanece en la navegación y Escape/backdrop devuelven el foco. La barra de guardado permanece invisible hasta editar. Se eliminó la fila duplicada de siete enlaces en Configuración; los destinos se encuentran en la navegación común. Tarjetas muestra el resultado antes de los controles, con retención accesible mediante un detalle. El selector de servidores busca nombres sin distinguir acentos y filtra instalación usando exclusivamente la lista ya autorizada.

`verify-panel-browser.js` confirma seis páginas (inicio, servidores, configuración, biblioteca, estadísticas y música), fuentes/iconos reales cargados con red externa bloqueada, cuatro anchos, límites de los contenedores visibles, nombres largos, estados vacíos, búsqueda/filtros, navegación contextual, foco/menú, barra de guardado y cola musical. Cero errores de página y cero recursos locales fallidos. Capturas en [evidence/panel](evidence/panel/browser.json); el baseline de Tarjetas está en `before-cards.png`. Las capturas respetan el ancho visible del navegador; los paneles fuera del viewport se excluyen del encuadre. No se simuló zoom real: los anchos CSS cubren reflow, y zoom con cliente real queda pendiente.

Regresiones de Tarjetas, Bienvenida y Ayuda pasan en Chromium con sus APIs/servicios reales y adaptadores aislados de datos/permisos. La primera comprobación detectó un mínimo derivado de aspect-ratio que hacía desbordar el preview móvil; se corrigió el contenedor. La suite del proyecto pasó 363/363, sin fallos/skips. La inspección posterior de capturas corrigió botones innecesariamente estrechos, banderas sin glifos y gráficos sobredimensionados. El comprobador espera dos frames tras cada cambio de viewport antes de medir el diseño.

Las mediciones esperan que Chromium confirme el breakpoint CSS solicitado y después dos frames: leer innerWidth inmediatamente tras emular el viewport podía preceder a la aplicación de la media query. Los límites de overflow y de controles se conservan. Las gráficas y animaciones CSS respetan reduced-motion, incluyendo el número de iteraciones de los indicadores.

Estos fixtures no utilizan sesiones, credenciales ni Mongo de producción. El rediseño no cierra la aceptación funcional del resto del maestro. Los cambios locales previos de Architect y sus evidencias permanecen fuera del commit/despliegue.
