// ─────────────────────────────────────────────────────────────────────────────
// Port de `src/config` de Soundy. Expone `client.config` tal como lo espera su código.
// Emojis = registro semántico OBEY con fallback Unicode.
// ⚠️ defaultSearchPlatform NO es spotify (bloqueado en el VPS): ver searchChain.
// ─────────────────────────────────────────────────────────────────────────────

// Approved character assets use application IDs only after a verified sync.
const { registry, musicKeys } = require('../assets/registry')
const emoji = Object.fromEntries(Object.keys(musicKeys).map(key => [key, registry.musicEmoji(key)]))

const color = {
  primary:   0x00ff33,
  secondary: 0x00ff00,
  yes:       0x00ff33,
  no:        0xff0000,
  warn:      0xffff00,
}

const config = {
  emoji,
  color,
  // Texto/branding
  info: {
    banner: 'https://i.ibb.co/GfTxbJfC/7-edited.png',
    supportServer: process.env.SUPPORT_SERVER || '',
  },
  defaultPrefix: process.env.PREFIX || '!',
  defaultLocale: process.env.LANGUAGE || 'es-ES',
  lyricsLines: 7,           // ventana de líneas del karaoke (Soundy: config.lyricsLines)

  // ⚠️ Parche VPS: Soundy usaba "spotify" (bloqueado). Cadena real de OBEY:
  defaultSearchPlatform: 'ytsearch',
  searchChain: ['spsearch', 'ytsearch'],
}

module.exports = { config, emoji, color }
