import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = { title: 'OBEY · Panel de comunidad', description: 'Tu comunidad, música y configuración en OBEY.', icons: { icon: '/bot.png' }, robots: { index: false, follow: false } }
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><head><link rel="stylesheet" href="/css/fonts.css" /></head><body>{children}</body></html>
}
