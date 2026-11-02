/** Contrato propuesto para una revisión segura de cambios de Builder. */
export type Diferencia = {
  tipo: 'canal' | 'rol' | 'permiso' | 'categoria'
  accion: 'crear' | 'editar' | 'eliminar' | 'mover'
  id?: string
  nombre: string
}
export type VistaPrevia = { borradorId: string; revision: string; diferencias: Diferencia[]; advertencias: string[] }
export type Aplicacion = { id: string; servidorId: string; revision: string; confirmacion: string }
