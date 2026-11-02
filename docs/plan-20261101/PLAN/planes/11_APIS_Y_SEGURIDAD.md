# 11 · APIs, dominios y seguridad

La interfaz React usa un **único cliente HTTP tipado**. La autoridad de escritura actual es Express; no duplicar operaciones de Builder, música ni permisos dentro de Next.

## Mapa mínimo de endpoints propuestos (NO publicados)

| Método | Ruta | Responsable | Seguridad/estado |
|---|---|---|---|
| GET | `/api/yo` | Sesión | Sesión verificada |
| GET | `/api/servidores` | Servidores | Lista filtrada por acceso actual |
| GET | `/api/servidores/:id/resumen` | Servidores | Permisos vigentes, tenant |
| GET | `/api/servidores/:id/modulos` | Configuración | Capacidades reales, flags |
| PATCH | `/api/servidores/:id/modulos/:modulo` | Configuración | CSRF, schema, permisos y revisión |
| GET | `/api/servidores/:id/builder` | Builder | Snapshot limitado y válido |
| GET | `/api/servidores/:id/builder/plantillas` | Builder | Autorización plantilla / servidor |
| POST | `/api/servidores/:id/builder/borradores` | Builder | Validación, revisión, owner |
| POST | `/api/servidores/:id/builder/simular` | Builder | Diff, simulación sin escribir |
| POST | `/api/servidores/:id/builder/aplicar` | Builder | Idempotencia, permisos frescos, confirmación y respaldo |
| GET | `/api/servidores/:id/musica` | Música | Estado canónico del player |
| POST | `/api/servidores/:id/musica/acciones` | Música | Voice/actor/guild/autorización; una operación |
| GET | `/api/servidores/:id/tickets` | Tickets | Filtrado por roles/canal |
| GET | `/api/servidores/:id/registros` | Registros | Paginar, redactar datos, permisos |
| GET | `/api/servidores/:id/actividad` | Actividad | Cursor y actor autorizado |
| GET | `/api/servidores/:id/eventos` | Tiempo real | SSE autenticado o Socket.IO |

Estas son **propuestas de contratos**, no rutas realmente expuestas en GitHub.

## Reglas transversales

1. OAuth de Discord con state, PKCE si corresponde, cookies HttpOnly/Secure/SameSite y revocación.
2. Permisos en el **servidor**, no basados únicamente en UI ni en claims viejos de sesión. Identificar guild y actor en cada operación.
3. CSRF en escrituras con sesión, origin check, límite de payload y validación con schema.
4. Control de concurrencia por revisión/version (`409 revision_conflict`); deduplicación de operaciones sensibles.
5. Builder tiene aplicación explícita en dos pasos: vista previa/diff, respaldo, confirmación, revalidación, ejecución y recibo auditado. Sin aplicar plantillas de terceros a ciegas.
6. No duplicar la autoridad de colas: un solo reproductor Lavalink por guild; eventos y reconexión desde bot/backend.
7. Tiempo real con eventos tipados, tenant y reconexión con snapshot; no anunciar el estado de un socket como estado de reproducción.
8. Trazabilidad de acciones y errores seguros para el usuario; no enviar secretos ni tokens al navegador.

## Dato técnico verificado

`dashboard/frontend/next.config.ts` usa `output:'export'` en producción. **No** agregar `app/api/route.ts` con cookies / Request mientras se use export estático. Alternativa A: Next estático + Express API; B: migrar Next a runtime Node y habilitar BFF con pruebas de sesión, sin duplicar dominio.
