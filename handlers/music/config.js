// ─────────────────────────────────────────────────────────────────────────────
// Port de `src/config` de Soundy. Expone `client.config` tal como lo espera su código.
// Emojis = los subidos a la app de OBEY (mismas imágenes que Soundy).
// ⚠️ defaultSearchPlatform NO es spotify (bloqueado en el VPS): ver searchChain.
// ─────────────────────────────────────────────────────────────────────────────

// Mapea las CLAVES que usa el código de Soundy (clock, volUp, nodeOn...) → markup real
const emoji = {
  yes:      '<:yes:1517013061687443559>',
  no:       '<:no:1517013066246652045>',
  link:     '<:link:1517013070076051486>',
  party:    '<:party:1517013073443950716>',
  artist:   '<:artist:1517013076925349889>',
  clock:    '<:cooldown:1517013080964468867>',   // Soundy: emoji.clock
  user:     '<:user:1517013085011972156>',
  play:     '<:play:1517013088879120414>',
  pause:    '<:pause:1517013092683223051>',
  loop:     '<:loop:1517013096357695549>',
  shuffle:  '<:shuffle:1517013100555931718>',
  previous: '<:previous:1517013104309833768>',
  rewind:   '<:rewind:1517013108114067556>',
  forward:  '<:forward:1517013111931011222>',
  skip:     '<:skip:1517013115290517526>',
  stop:     '<:stop:1517013119380099102>',
  trash:    '<:trash:1517013122798321667>',
  volUp:    '<:volup:1517013126309089374>',      // Soundy: emoji.volUp
  volDown:  '<:voldown:1517013129941352661>',    // Soundy: emoji.volDown
  list:     '<:list:1517013133586202825>',
  info:     '<:info:1517013137453486143>',
  music:    '<:music:1517013141169504339>',
  warn:     '<:warn:1517013145066016950>',
  home:     '<:home:1517013148513603620>',
  globe:    '<:globe:1517013152347324528>',
  slash:    '<:slash:1517013156269002843>',
  ping:     '<:ping:1517013159477510175>',
  question: '<:question:1517013163487400026>',
  pencil:   '<:pencil:1517013166620545046>',
  folder:   '<:folder:1517013177781456906>',
  heart:    '<:heart:1517011204877455422>',
  think:    '<a:think:1517013189181571152>',
  nodeOn:   '<:g_:1517013181804052641>',          // Soundy: emoji.nodeOn
  nodeOff:  '<:r_:1517013185545244762>',          // Soundy: emoji.nodeOff
  // Extra de OBEY (no estaba en Soundy)
  disk:     '<a:disk:1517011209101115563>',
}

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
  defaultSearchPlatform: 'ytmsearch',
  searchChain: ['spsearch', 'ytmsearch', 'ytsearch'],
}

module.exports = { config, emoji, color }
