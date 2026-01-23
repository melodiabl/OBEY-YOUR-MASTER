const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed, replyError } = require('../../core/ui/messageKit')
const { headerLine } = require('../../core/ui/uiKit')

function normKey (raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

const CATEGORY_META = Object.freeze({
  info: { label: 'Información', emoji: Emojis.info, order: 10 },
  economy: { label: 'Economía', emoji: Emojis.economy, order: 20 },
  economia: { label: 'Economía', emoji: Emojis.economy, order: 20 },
  music: { label: 'Música', emoji: Emojis.music, order: 30 },
  funny: { label: 'Diversión', emoji: Emojis.fun, order: 40 },
  games: { label: 'Juegos', emoji: Emojis.games, order: 45 },
  moderacion: { label: 'Moderación', emoji: Emojis.moderation, order: 50 },
  moderation: { label: 'Moderación', emoji: Emojis.moderation, order: 50 },
  utility: { label: 'Utilidad', emoji: Emojis.utility, order: 60 },
  config: { label: 'Config', emoji: Emojis.system, order: 70 },
  ai: { label: 'IA', emoji: Emojis.ai, order: 80 },
  levels: { label: 'Niveles', emoji: Emojis.level, order: 90 },
  marriage: { label: 'Romance', emoji: Emojis.reputation, order: 100 },
  dueno: { label: 'Dueño', emoji: Emojis.owner, order: 999 },
  owner: { label: 'Dueño', emoji: Emojis.owner, order: 999 }
})

function getCategoryMeta (category) {
  const key = normKey(category)
  const meta = CATEGORY_META[key]
  if (meta) return { key, ...meta }
  return { key, label: String(category || 'Otros'), emoji: Emojis.system, order: 500 }
}

function findCommand (client, token) {
  const q = normKey(token)
  if (!q) return null

  for (const c of client.commands.values()) {
    if (normKey(c?.NAME) === q) return c
  }
  for (const c of client.commands.values()) {
    const aliases = Array.isArray(c?.ALIASES) ? c.ALIASES : []
    if (aliases.some(a => normKey(a) === q)) return c
  }
  return null
}

function buildCategoriesIndex (client) {
  const buckets = new Map()
  for (const c of client.commands.values()) {
    const meta = getCategoryMeta(c.CATEGORY)
    if (!buckets.has(meta.key)) buckets.set(meta.key, { meta, commands: [] })
    buckets.get(meta.key).commands.push(c)
  }

  const list = [...buckets.values()]
  for (const b of list) {
    b.commands.sort((a, b) => String(a.NAME).localeCompare(String(b.NAME), 'en', { sensitivity: 'base' }))
  }

  return list.sort((a, b) => (a.meta.order - b.meta.order) || a.meta.label.localeCompare(b.meta.label, 'es', { sensitivity: 'base' }))
}

module.exports = {
  DESCRIPTION: 'Muestra ayuda y comandos (legacy prefix).',
  ALIASES: ['ayuda', 'h'],
  async execute (client, message, args, prefix) {
    const p = String(prefix || '!').trim() || '!'
    const token = String(args?.[0] || '').trim()
    const index = buildCategoriesIndex(client)

    if (token) {
      const cmd = findCommand(client, token)
      if (cmd) {
        const meta = getCategoryMeta(cmd.CATEGORY)
        const aliases = Array.isArray(cmd.ALIASES) && cmd.ALIASES.length
          ? cmd.ALIASES.map(a => Format.inlineCode(`${p}${a}`)).join(', ')
          : Format.italic('Sin aliases')

        const perms = Array.isArray(cmd.PERMISSIONS) && cmd.PERMISSIONS.length
          ? cmd.PERMISSIONS.map(x => Format.inlineCode(x)).join(', ')
          : Format.italic('Ninguno')

        const botPerms = Array.isArray(cmd.BOT_PERMISSIONS) && cmd.BOT_PERMISSIONS.length
          ? cmd.BOT_PERMISSIONS.map(x => Format.inlineCode(x)).join(', ')
          : Format.italic('Ninguno')

        return replyEmbed(client, message, {
          system: 'info',
          kind: 'info',
          title: `${meta.emoji} ${cmd.NAME}`,
          description: [
            headerLine(meta.emoji, 'Detalle del comando'),
            `${Emojis.dot} **Descripción:** ${cmd.DESCRIPTION ? Format.italic(cmd.DESCRIPTION) : Format.italic('Sin descripción.')}`,
            `${Emojis.dot} **Uso:** ${Format.inlineCode(`${p}${cmd.NAME} ...`)}`,
            `${Emojis.dot} **Aliases:** ${aliases}`,
            Format.softDivider(20),
            `${Emojis.lock} **Permisos usuario:** ${perms}`,
            `${Emojis.system} **Permisos bot:** ${botPerms}`,
            cmd.OWNER ? `${Emojis.crown} **Solo owners**` : null
          ].filter(Boolean).join('\n'),
          signature: 'Tip: para UX premium usa /panel'
        })
      }

      const catKey = normKey(token)
      const bucket = index.find(b => b.meta.key === catKey)
      if (!bucket) {
        return replyError(client, message, {
          system: 'info',
          title: 'No encontré eso',
          reason: `No existe el comando/categoría: ${Format.inlineCode(token)}`,
          hint: `Usa ${Format.inlineCode(`${p}help`)} para ver la lista.`
        })
      }

      const items = bucket.commands.map(c => `${Format.inlineCode(`${p}${c.NAME}`)} ${Emojis.dot} ${Format.italic(c.DESCRIPTION || '')}`.trim())
      const desc = [
        headerLine(bucket.meta.emoji, bucket.meta.label),
        `${Emojis.dot} Comandos: **${bucket.commands.length}**`,
        Format.softDivider(20),
        ...items.slice(0, 20),
        bucket.commands.length > 20 ? `${Emojis.dot} ${Format.italic(`... y ${bucket.commands.length - 20} más`)}` : null
      ].filter(Boolean).join('\n')

      return replyEmbed(client, message, {
        system: 'info',
        kind: 'info',
        title: `${bucket.meta.emoji} ${bucket.meta.label}`,
        description: desc,
        signature: `Usa ${Format.inlineCode(`${p}help <comando>`)} para detalles`
      })
    }

    const categories = index
      .filter(b => b.commands.length)
      .map(b => {
        const preview = b.commands.slice(0, 4).map(c => Format.inlineCode(`${p}${c.NAME}`)).join(', ')
        return {
          name: `${b.meta.emoji} ${b.meta.label}`,
          value: `${Emojis.dot} **${b.commands.length}** comandos\n${preview}${b.commands.length > 4 ? `\n${Emojis.dot} ${Format.italic('…más dentro')}` : ''}`,
          inline: true
        }
      })

    return replyEmbed(client, message, {
      system: 'info',
      kind: 'info',
      title: `${Emojis.crown} OBEY YOUR MASTER`,
      description: [
        headerLine(Emojis.info, 'Ayuda (modo compat)'),
        `${Emojis.dot} Hola ${Format.bold(message.author.username)}.`,
        `${Emojis.dot} Buscador: ${Format.inlineCode(`${p}help <comando|categoria>`)}`,
        `${Emojis.dot} Experiencia premium: ${Format.inlineCode('/panel')} y ${Format.inlineCode('/help')}.`
      ].join('\n'),
      fields: categories,
      signature: 'El futuro es slash ✨'
    })
  }
}
