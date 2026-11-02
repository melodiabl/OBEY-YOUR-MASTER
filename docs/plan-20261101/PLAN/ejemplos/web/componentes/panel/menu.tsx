'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, useReducedMotion } from 'motion/react'

const secciones = [
  { etiqueta: 'Resumen', ruta: '' },
  { etiqueta: 'Constructor', ruta: '/builder' },
  { etiqueta: 'Música', ruta: '/musica' },
  { etiqueta: 'Moderación', ruta: '/moderacion' },
  { etiqueta: 'Seguridad', ruta: '/seguridad' },
  { etiqueta: 'Registros', ruta: '/registros' },
  { etiqueta: 'Tickets', ruta: '/tickets' },
  { etiqueta: 'Comunidad', ruta: '/comunidad' },
  { etiqueta: 'Automatizaciones', ruta: '/automatizaciones' },
  { etiqueta: 'Estadísticas', ruta: '/estadisticas' },
  { etiqueta: 'Ajustes', ruta: '/ajustes' },
] as const

export function Menu({ servidor }: { servidor: string }) {
  const ruta = usePathname()
  const menos = useReducedMotion()
  const base = `/panel/${encodeURIComponent(servidor)}`
  return <nav aria-label="Panel del servidor">
    {secciones.map(({ etiqueta, ruta: sufijo }) => {
      const href = `${base}${sufijo}`
      const activo = sufijo ? ruta === href || ruta.startsWith(`${href}/`) : ruta === base
      return <Link key={href} href={href} aria-current={activo ? 'page' : undefined} className="menu-opcion">
        {activo && <motion.span layoutId="menu-activo" className="menu-indicador"
          transition={menos ? { duration: 0 } : { type: 'spring', stiffness: 480, damping: 42 }} />}
        <span>{etiqueta}</span>
      </Link>
    })}
  </nav>
}
