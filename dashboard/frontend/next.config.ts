import type { NextConfig } from 'next'
const development = process.env.NODE_ENV === 'development'
const backend = process.env.OBEY_DASHBOARD_ORIGIN || 'http://127.0.0.1:3002'
const config: NextConfig = {
  basePath: '/app',
  trailingSlash: true,
  output: development ? undefined : 'export',
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  images: { unoptimized: true },
  experimental: { cpus: 2 },
  ...(development ? {
    async rewrites() {
      return ['api', 'socket.io', 'fonts', 'css', 'obey-icons', 'login', 'auth', 'logout', 'dashboard', 'panel', 'music', 'library', 'configuration', 'help'].map(route => ({
        source: `/${route}/:path*`, destination: `${backend}/${route}/:path*`, basePath: false as const,
      }))
    },
  } : {}),
}
export default config
