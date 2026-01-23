const { EmbedBuilder } = require('discord.js')
const TTLCache = require('../cache/ttlCache')
const BaseEmojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

const guildUiCache = new TTLCache({ defaultTtlMs: 30_000, maxSize: 50_000 })

const THEMES = Object.freeze({
  dark: 'dark',
  light: 'light'
})

const SYSTEM_STYLES = Object.freeze({
  moderation: { emoji: BaseEmojis.moderation, color: 0xed4245 },
  music: { emoji: BaseEmojis.music, color: 0x5865f2 },
  economy: { emoji: BaseEmojis.economy, color: 0xf1c40f },
  games: { emoji: BaseEmojis.games, color: 0x57f287 },
  fun: { emoji: BaseEmojis.fun, color: 0xeb459e },
  clans: { emoji: BaseEmojis.clan, color: 0x9b59b6 },
  levels: { emoji: BaseEmojis.level, color: 0xfee75c },
  reputation: { emoji: BaseEmojis.reputation, color: 0xeb459e },
  ai: { emoji: BaseEmojis.ai, color: 0x5865f2 },
  tickets: { emoji: BaseEmojis.ticket, color: 0x3498db },
  logs: { emoji: BaseEmojis.logs, color: 0x95a5a6 },
  announcements: { emoji: BaseEmojis.announcements, color: 0xe67e22 },
  config: { emoji: BaseEmojis.system, color: 0xf39c12 },
  notifications: { emoji: BaseEmojis.notifications, color: 0x3498db },
  polls: { emoji: BaseEmojis.polls, color: 0x9b59b6 },
  inventory: { emoji: BaseEmojis.inventory, color: 0x1abc9c },
  events: { emoji: BaseEmojis.events, color: 0x2ecc71 },
  learning: { emoji: BaseEmojis.learning, color: 0x9b59b6 },
  auth: { emoji: BaseEmojis.learning, color: 0x9b59b6 },
  infra: { emoji: BaseEmojis.system, color: 0x95a5a6 },
  security: { emoji: BaseEmojis.security, color: 0xe74c3c },
  info: { emoji: BaseEmojis.info, color: 0x3498db },
  utility: { emoji: BaseEmojis.utility, color: 0x99aab5 }
})

const KIND_COLORS = Object.freeze({
  success: 0x57f287,
  error: 0xed4245,
  warn: 0xfee75c,
  info: 0x5865f2,
  neutral: 0x2f3136
})

function normalizeEmojiOverrides (raw) {
  if (!raw) return {}
  if (typeof raw.get === 'function') {
    const out = {}
    for (const [k, v] of raw.entries()) out[String(k)] = String(v)
    return out
  }
  if (typeof raw === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(raw)) out[String(k)] = String(v)
    return out
  }
  return {}
}

function getSystemStyle (systemKey) {
  return SYSTEM_STYLES?.[systemKey] || { emoji: BaseEmojis.system, color: 0x99aab5 }
}

function headerLine (emoji, title) {
  return `${emoji} **${title}**\n${Format.divider(18)}`
}

function footerLine (ui, text) {
  const t = String(text || '').trim()
  if (!t) return null
  return `${emoji(ui, 'star')} ${Format.italic(t)} ${emoji(ui, 'star')}`
}

function toLines (value) {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean).map(String)
  return String(value).split('\n').filter(Boolean)
}

async function getGuildUiConfig (client, guildId) {
  const key = String(guildId || '')
  const cached = guildUiCache.get(key)
  if (cached) return cached

  let guildData = null
  try {
    guildData = await client?.db?.getGuildData?.(key)
  } catch (e) {}

  const theme = String(guildData?.theme || THEMES.dark)
  const emojiOverrides = normalizeEmojiOverrides(guildData?.emojiOverrides)
  const visualPrefix = String(guildData?.visualPrefix || '•')

  return guildUiCache.set(key, { theme, emojiOverrides, visualPrefix }, 30_000)
}

function invalidateGuildUiConfig (guildId) {
  guildUiCache.delete(String(guildId || ''))
}

function emoji (ui, key) {
  const override = ui?.emojiOverrides?.[key]
  if (override) return override
  return BaseEmojis?.[key] || '•'
}

function embed ({
  ui,
  system = 'utility',
  kind = 'neutral',
  title,
  description,
  lines,
  fields,
  footer,
  signature,
  thumbnail,
  image,
  timestamp = true
} = {}) {
  const style = getSystemStyle(system)
  const color = KIND_COLORS[kind] ?? style.color

  const e = new EmbedBuilder().setColor(color)
  if (title) e.setTitle(String(title))

  const allLines = []
  if (description) allLines.push(...toLines(description))
  if (lines) allLines.push(...toLines(lines))
  if (signature) {
    const sig = footerLine(ui, signature)
    if (sig) allLines.push('', sig)
  }
  if (allLines.length) e.setDescription(allLines.join('\n'))

  if (Array.isArray(fields) && fields.length) e.addFields(fields)
  if (footer) e.setFooter({ text: String(footer) })
  if (thumbnail) e.setThumbnail(String(thumbnail))
  if (image) e.setImage(String(image))
  if (timestamp) e.setTimestamp()
  return e
}

function okEmbed ({ ui, system, title, lines, fields, footer, signature, thumbnail, image } = {}) {
  const style = getSystemStyle(system)
  return embed({
    ui,
    system,
    kind: 'success',
    title: title ? String(title) : `${emoji(ui, 'success')} Éxito`,
    description: lines ? [headerLine(style.emoji, 'Listo'), ...toLines(lines)].join('\n') : headerLine(style.emoji, 'Listo'),
    fields,
    footer,
    signature,
    thumbnail,
    image
  })
}

function errorEmbed ({ ui, system, title, reason, hint, fields, footer, signature, thumbnail, image } = {}) {
  const lines = [
    headerLine(emoji(ui, 'error'), title || 'No se pudo completar'),
    reason ? `${emoji(ui, 'quote')} ${Format.italic(reason)}` : null,
    hint ? `${emoji(ui, 'arrow')} ${hint}` : null
  ].filter(Boolean)

  return embed({
    ui,
    system,
    kind: 'error',
    title: `${emoji(ui, 'error')} Error`,
    description: lines.join('\n'),
    fields,
    footer,
    signature,
    thumbnail,
    image
  })
}

function warnEmbed ({ ui, system, title, lines, fields, footer, signature, thumbnail, image } = {}) {
  const body = [
    headerLine(emoji(ui, 'warn'), title || 'Atención'),
    ...toLines(lines)
  ].filter(Boolean)

  return embed({
    ui,
    system,
    kind: 'warn',
    title: `${emoji(ui, 'warn')} Aviso`,
    description: body.join('\n'),
    fields,
    footer,
    signature,
    thumbnail,
    image
  })
}

function infoEmbed ({ ui, system, title, lines, fields, footer, signature, thumbnail, image } = {}) {
  const style = getSystemStyle(system)
  const body = [
    headerLine(style.emoji, title || 'Información'),
    ...toLines(lines)
  ].filter(Boolean)

  return embed({
    ui,
    system,
    kind: 'info',
    title: `${style.emoji} ${title || 'Info'}`,
    description: body.join('\n'),
    fields,
    footer,
    signature,
    thumbnail,
    image
  })
}

async function safeReply (interaction, payload) {
  try {
    if (interaction.deferred || interaction.replied) return await interaction.editReply(payload)
    return await interaction.reply(payload)
  } catch (e) {
    try {
      if (interaction.deferred || interaction.replied) return await interaction.followUp(payload)
    } catch (_) {}
  }
}

module.exports = {
  THEMES,
  SYSTEM_STYLES,
  getGuildUiConfig,
  invalidateGuildUiConfig,
  emoji,
  headerLine,
  footerLine,
  embed,
  okEmbed,
  errorEmbed,
  warnEmbed,
  infoEmbed,
  safeReply
}
