# Identidad y arquitectura web: decisión

La referencia es el CSS real de `dashboard/frontend/app/globals.css` y `dashboard/public/css/style.css` del repositorio; no la paleta del personaje OBEY.

## Versión observada
- `dashboard/frontend/package.json`: Next.js `16.4.3`, React `19.3.1`, TypeScript `5.9.3`.
- `dashboard/frontend/next.config.ts`: `basePath:'/app'`, exportación estática en producción; hay proxy a Express durante desarrollo.
- Las APIs actuales, OAuth, sesión, privilegios de Discord y tiempo real se gestionan fuera del frontend Next (backend Express).

## Decisión de despliegue, aún no ejecutada

**P1 recomendado:** mantener Express como autoridad de API, sesiones y comandos del bot, mientras el nuevo Next consume contratos y eventos tipados; usar Next como frontend renovado. Sus páginas no deben fingir que existe un servidor Next con API dinámica cuando `output:'export'` está activado.

**P2 opcional:** cambiar Next a runtime Node para Route Handlers (`app/api/.../route.ts`) como BFF, sin replicar el dominio de tickets, permisos, música, Builder o auth. Migrar solo tras pruebas OAuth, cookies, reverse proxy, SSR, CSRF, CORS, y rollback. La exportación estática no admite Route Handlers dependientes de Request, cookies de servidor, rutas dinámicas no generadas ni Server Actions.

No agregar paletas nuevas, archivos GIF ni paquetes de emojis para decorar el panel.
