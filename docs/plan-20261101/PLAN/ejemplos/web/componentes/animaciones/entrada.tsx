'use client'
import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

/** Patrón: aparición sutil de una página. No representa carga de datos. */
export function Entrada({ children }: { children: ReactNode }) {
  const menos = useReducedMotion()
  return <motion.div
    initial={menos ? false : { opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: menos ? 0 : 0.22, ease: 'easeOut' }}>
    {children}
  </motion.div>
}
