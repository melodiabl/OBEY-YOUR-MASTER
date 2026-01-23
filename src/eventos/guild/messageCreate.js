const TTLCache = require('../../core/cache/ttlCache')
const Systems = require('../../systems')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { getGuildUiConfig, headerLine, embed, warnEmbed, errorEmbed } = require('../../core/ui/uiKit')

const legacyHintCache = new TTLCache({ defaultTtlMs: 15 * 60_000, maxSize: 200_000 })
const aiChannelCache = new TTLCache({ defaultTtlMs: 60_000, maxSize: 50_000 })
const aiCooldownCache = new TTLCache({ defaultTtlMs: 12_000, maxSize: 200_000 })
const aiMisconfigCache = new TTLCache({ defaultTtlMs: 60 * 60_000, maxSize: 50_000 })

function parseLegacyMode () {
  const v = String(process.env.LEGACY_PREFIX_MODE || 'compat').trim().toLowerCase()
  if (['disabled', 'off', '0', 'false', 'no'].includes(v)) return 'disabled'
  if (['hint', 'soft'].includes(v)) return 'hint'
  return 'compat'
}

function normalizePrefixes ({ client, message, guildData }) {
  const envPrefixes = String(process.env.PREFIX || '!').trim().split(/\s+/).filter(Boolean)
  const dbPrefix = String(guildData?.prefix || '').trim()
  const mentionPrefix = `<@!${client.user.id}> `
  const mentionPrefixAlt = `<@${client.user.id}> `

  return [...new Set([...envPrefixes, dbPrefix, mentionPrefix, mentionPrefixAlt])].filter(Boolean)
}

async function replySafe (message, payload) {
  try {
    return await message.reply(payload)
  } catch (e) {}
}

async function maybeHandleAiChannel ({ client, message, prefixes }) {
  if (String(process.env.AI_CHANNEL_AUTOREPLY_DISABLED || '').trim() === '1') return false
  if (!message.guild || !message.channel) return false

  const raw = String(message.content || '')
  const content = raw.trim()
  if (!content) return false
  if (content.startsWith('/')) return false
  if (message.mentions?.everyone) return false

  // Evita colisionar con comandos legacy por prefijo.
  if (Array.isArray(prefixes) && prefixes.some(p => p && raw.startsWith(p))) return false

  const guildId = message.guild.id
  let aiChannelId = aiChannelCache.get(guildId)
  if (aiChannelId === undefined) {
    const gd = await client.db.getGuildData(guildId).catch(() => null)
    aiChannelId = gd?.aiChannel || null
    aiChannelCache.set(guildId, aiChannelId)
  }
  if (!aiChannelId || message.channel.id !== aiChannelId) return false

  const cdKey = `${guildId}:${message.author.id}`
  if (aiCooldownCache.get(cdKey)) return true
  aiCooldownCache.set(cdKey, true)

  const ui = await getGuildUiConfig(client, guildId)

  // Si no hay API key, avisar 1 vez por hora por guild.
  if (!String(process.env.OPENAI_API_KEY || '').trim()) {
    const warnKey = `${guildId}:missing_openai_key`
    if (!aiMisconfigCache.get(warnKey)) {
      aiMisconfigCache.set(warnKey, true)
      const e = warnEmbed({
        ui,
        system: 'ai',
        title: 'IA no configurada',
        lines: [
          `${Emojis.dot} Este servidor tiene un canal IA configurado, pero falta ${Format.inlineCode('OPENAI_API_KEY')}.`,
          `${Emojis.dot} Admin: configura el host y reinicia el bot.`,
          `${Emojis.dot} Canal IA: <#${aiChannelId}>`
        ]
      })
      await replySafe(message, { embeds: [e], allowedMentions: { repliedUser: false } })
    }
    return true
  }

  try {
    await message.channel.sendTyping().catch(() => {})
    const res = await Systems.ai.ask({
      prompt: content,
      guildName: message.guild.name,
      userTag: message.author.tag,
      userId: message.author.id
    })

    const e = embed({
      ui,
      system: 'ai',
      kind: 'info',
      title: `${Emojis.ai} IA`,
      description: [
        headerLine(Emojis.ai, 'Respuesta'),
        `${Emojis.quote} ${Format.italic(content.length > 220 ? content.slice(0, 219) + '…' : content)}`,
        Format.softDivider(20),
        res.answer || Format.italic('Sin respuesta.')
      ].join('\n'),
      footer: `Model: ${res.model}`,
      signature: 'Recuerda: la IA puede equivocarse'
    })
    await replySafe(message, { embeds: [e], allowedMentions: { repliedUser: false } })
  } catch (e) {
    const err = errorEmbed({
      ui,
      system: 'ai',
      title: 'IA no disponible',
      reason: e?.message || 'Error desconocido.',
      hint: 'Tip: intenta con una pregunta más corta y específica.'
    })
    await replySafe(message, { embeds: [err], allowedMentions: { repliedUser: false } })
  }

  return true
}

module.exports = async (client, message) => {
  if (!message.guild || !message.channel || message.author.bot) return

  const GUILD_DATA = client.dbGuild.getGuildData(message.guild.id)

  // Sistema AFK
  try {
    await Systems.afk.checkAfk(message)
  } catch (e) {}

  // Sistema de Niveles (XP)
  try {
    const { handleMessageXp } = Systems.levels
    await handleMessageXp({ client, message })
  } catch (e) {}

  // Sistema de Quests (base)
  try {
    Systems.quests.queueMessage({ guildID: message.guild.id, userID: message.author.id, n: 1 })
  } catch (e) {}

  const prefixes = normalizePrefixes({ client, message, guildData: GUILD_DATA })

  // Canal IA (auto-reply) — solo si NO parece comando legacy.
  try {
    const handledAi = await maybeHandleAiChannel({ client, message, prefixes })
    if (handledAi) return
  } catch (e) {}

  const prefix = prefixes.find(p => message.content.startsWith(p))
  if (!prefix) return

  const ARGS = message.content.slice(prefix.length).trim().split(/ +/)
  const CMD = ARGS?.shift()?.toLowerCase()
  if (!CMD) return

  const COMANDO = client.commands.get(CMD) || client.commands.find(c => c.ALIASES && c.ALIASES.includes(CMD))
  if (!COMANDO) return

  const ui = await getGuildUiConfig(client, message.guild.id)
  const legacyMode = parseLegacyMode()

  // Modo "solo slash": no ejecuta comandos legacy.
  if (legacyMode === 'disabled') {
    const e = warnEmbed({
      ui,
      system: 'info',
      title: 'Migración a Slash Commands',
      lines: [
        `${Emojis.dot} Este bot ahora opera en modo slash (sin prefijos).`,
        `${Emojis.dot} Usa ${Format.inlineCode('/help')} para ver el panel premium.`,
        `${Emojis.dot} Intentaste: ${Format.inlineCode(`${prefix}${CMD}`)}`
      ]
    })
    return replySafe(message, { embeds: [e], allowedMentions: { repliedUser: false } })
  }

  const ownerIds = String(process.env.OWNER_IDS || '').split(/\s+/).filter(Boolean)

  if (COMANDO.OWNER) {
    if (!ownerIds.includes(message.author.id)) {
      const e = errorEmbed({
        ui,
        system: 'security',
        title: 'Acceso denegado',
        reason: 'Solo los dueños del bot pueden ejecutar ese comando.',
        hint: ownerIds.length ? `Owners: ${ownerIds.map(id => `<@${id}>`).join(', ')}` : 'Config: define OWNER_IDS en el .env'
      })
      return replySafe(message, { embeds: [e], allowedMentions: { repliedUser: false } })
    }
  }

  if (COMANDO.BOT_PERMISSIONS) {
    if (!message.guild.members.me.permissions.has(COMANDO.BOT_PERMISSIONS)) {
      const e = errorEmbed({
        ui,
        system: 'security',
        title: 'Me faltan permisos',
        reason: 'No tengo permisos suficientes para ejecutar esto.',
        hint: `Necesito: ${COMANDO.BOT_PERMISSIONS.map(p => Format.inlineCode(p)).join(', ')}`
      })
      return replySafe(message, { embeds: [e], allowedMentions: { repliedUser: false } })
    }
  }

  if (COMANDO.PERMISSIONS) {
    if (!message.member.permissions.has(COMANDO.PERMISSIONS)) {
      const e = errorEmbed({
        ui,
        system: 'security',
        title: 'Permisos requeridos',
        reason: 'No tienes permisos suficientes para ejecutar esto.',
        hint: `Necesitas: ${COMANDO.PERMISSIONS.map(p => Format.inlineCode(p)).join(', ')}`
      })
      return replySafe(message, { embeds: [e], allowedMentions: { repliedUser: false } })
    }
  }

  try {
    await COMANDO.execute(client, message, ARGS, prefix, GUILD_DATA)
  } catch (e) {
    const err = errorEmbed({
      ui,
      system: 'security',
      title: 'Error ejecutando comando',
      reason: e?.message || 'Error desconocido.',
      hint: `Comando: ${Format.inlineCode(`${prefix}${COMANDO.NAME || CMD}`)}`
    })
    await replySafe(message, { embeds: [err], allowedMentions: { repliedUser: false } })
    console.log(e)
  }

  // Modo compat + hint: recordatorio suave (rate-limited).
  if (legacyMode === 'hint') {
    const k = `${message.guild.id}:${message.author.id}:legacy_hint`
    if (!legacyHintCache.get(k)) {
      legacyHintCache.set(k, true)
      const e = embed({
        ui,
        system: 'info',
        kind: 'info',
        title: `${Emojis.info} Tip`,
        description: [
          headerLine(Emojis.info, 'Más rápido con Slash'),
          `${Emojis.dot} Probá ${Format.inlineCode('/help')} para abrir el panel premium.`,
          `${Emojis.dot} Los comandos con prefijo están en modo compatibilidad.`
        ].join('\n'),
        signature: 'Una experiencia más limpia'
      })
      await replySafe(message, { embeds: [e], allowedMentions: { repliedUser: false } })
    }
  }
}
