/** Ejemplo de transporte, no SDK de producción. El backend valida permisos y CSRF. */
export class ErrorApi extends Error {
  constructor(public estado: number, public codigo: string) { super(codigo) }
}
export async function api<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const respuesta = await fetch(ruta, { ...opciones, credentials: 'same-origin', cache: 'no-store' })
  const datos = await respuesta.json().catch(() => null)
  if (!respuesta.ok || datos?.ok === false) throw new ErrorApi(respuesta.status, datos?.error ?? 'error_api')
  return datos as T
}
