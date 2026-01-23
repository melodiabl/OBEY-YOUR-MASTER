const Emojis = require('../../../utils/emojis')
const Format = require('../../../utils/formatter')
const { embed, headerLine } = require('../uiKit')

const MOD_NAMES = new Set([
  'ban',
  'kick',
  'unban',
  'timeout',
  'untimeout',
  'warn',
  'warns',
  'unwarn',
  'clearwarns',
  'purge',
  'slowmode',
  'mod-history',
  'audit-latest'
])

const ECONOMY_NAMES = new Set([
  'balance',
  'profile',
  'daily',
  'work',
  'weekly',
  'monthly',
  'deposit',
  'withdraw',
  'shop',
  'buy',
  'sell',
  'inventory',
  'give',
  'gacha',
  'bet',
  'rob',
  'stream',
  'protect-buy'
])

const SYSTEM_NAMES = new Set([
  'ticket',
  'clan',
  'giveaway-start',
  'sync-run'
])

const HELP_CATEGORIES = Object.freeze([
  { key: 'main', label: 'Principales', emoji: '✨', description: 'Lo esencial y lo premium' },
  { key: 'music', label: 'Música', emoji: Emojis.music, description: 'Reproducción + controles' },
  { key: 'economy', label: 'Economía', emoji: Emojis.economy, description: 'Dinero, banco, tienda, progresión' },
  { key: 'moderation', label: 'Moderación', emoji: Emojis.moderation, description: 'Acciones y sanciones' },
  { key: 'levels', label: 'Niveles', emoji: Emojis.level, description: 'Rank y progreso' },
  { key: 'systems', label: 'Sistemas', emoji: Emojis.system, description: 'Tickets, clanes, sorteos, sync' },
  { key: 'utility', label: 'Utilidad', emoji: Emojis.utility, description: 'Herramientas y calidad de vida' },
  { key: 'config', label: 'Configuración', emoji: Emojis.system, description: 'Ajustes del servidor' },
  { key: 'fun', label: 'Diversión', emoji: Emojis.fun, description: 'Minijuegos y entretenimiento' },
  { key: 'ai', label: 'IA', emoji: Emojis.ai, description: 'Canal IA y preguntas' }
])

function isCategory (cmd, folder) {
  return String(cmd?.CATEGORY || '') === String(folder || '')
}

function matchesHelpCategory (cmd, key) {
  const name = String(cmd?.CMD?.name || cmd?.CMD?.data?.name || cmd?.CMD?.toJSON?.().name || cmd?.CMD?.name || cmd?.commandName || '').trim()
  const category = String(cmd?.CATEGORY || '').trim()

  if (key === 'music') return isCategory(cmd, 'music')
  if (key === 'config') return isCategory(cmd, 'Config')
  if (key === 'levels') return isCategory(cmd, 'Niveles') || name === 'rank'
  if (key === 'ai') return isCategory(cmd, 'Info') && name === 'ai'
  if (key === 'utility') return isCategory(cmd, 'Utilidad')

  if (key === 'economy') {
    if (ECONOMY_NAMES.has(name)) return true
    return ['economy', 'EconomiaPro', 'Gacha'].includes(category)
  }

  if (key === 'moderation') {
    if (MOD_NAMES.has(name)) return true
    return category === 'Moderacion'
  }

  if (key === 'systems') {
    if (SYSTEM_NAMES.has(name)) return true
    return ['Roles', 'Sorteos', 'Mascotas', 'Flat'].includes(category)
  }

  if (key === 'fun') {
    return ['Diversion', 'funny', 'Funny'].includes(category)
  }

  if (key === 'main') {
    return [
      'help',
      'panel',
      'play',
      'nowplaying',
      'queue',
      'profile',
      'balance',
      'rank',
      'config'
    ].includes(name)
  }

  return false
}

function listCommands (client, key) {
  const arr = []
  for (const c of client.slashCommands.values()) {
    if (matchesHelpCategory(c, key)) arr.push(c)
  }
  arr.sort((a, b) => String(a.CMD.name).localeCompare(String(b.CMD.name), 'en', { sensitivity: 'base' }))
  return arr
}

function describeCommandLine (cmd) {
  const name = `/${cmd.CMD.name}`
  const desc = String(cmd.CMD.description || '').trim() || 'Sin descripción.'
  return `${Emojis.dot} ${Format.bold(name)} *${desc}*`
}

function buildHelpHomeEmbed ({ ui, client }) {
  const total = client.slashCommands.size
  const main = listCommands(client, 'main').length
  const music = listCommands(client, 'music').length
  const economy = listCommands(client, 'economy').length
  const moderation = listCommands(client, 'moderation').length

  return embed({
    ui,
    system: 'info',
    kind: 'info',
    title: `${Emojis.crown} OBEY YOUR MASTER`,
    description: [
      headerLine(Emojis.info, 'Centro de ayuda'),
      `${Emojis.dot} Selecciona una categoría en el menú para ver comandos y atajos.`,
      `${Emojis.dot} Panel premium: ${Format.inlineCode('/panel')} (control, módulos, estado).`,
      `${Emojis.dot} Tip: muchos comandos tienen *subcomandos* (ej: ${Format.inlineCode('/ticket note add')}).`,
      Format.softDivider(20),
      `${Emojis.dot} ✨ Principales: ${Format.inlineCode(main)}`,
      `${Emojis.dot} ${Emojis.music} Música: ${Format.inlineCode(music)}`,
      `${Emojis.dot} ${Emojis.economy} Economía: ${Format.inlineCode(economy)}`,
      `${Emojis.dot} ${Emojis.moderation} Moderación: ${Format.inlineCode(moderation)}`,
      `${Emojis.dot} ${Emojis.stats} Total: ${Format.inlineCode(total)}`
    ].join('\n'),
    footer: 'Nada plano: todo premium, claro y con contexto'
  })
}

function buildHelpCategoryEmbed ({ ui, client, key }) {
  const cat = HELP_CATEGORIES.find(c => c.key === key) || HELP_CATEGORIES[0]
  const cmds = listCommands(client, cat.key)

  const list = cmds.length
    ? cmds.map(describeCommandLine).join('\n')
    : `${Emojis.dot} ${Format.italic('Sin comandos en esta categoría.')}`

  const extraTips = []
  if (cat.key === 'music') {
    extraTips.push(`${Emojis.dot} Tip: ${Format.inlineCode('/play')} ofrece selección premium cuando buscas por texto.`)
    extraTips.push(`${Emojis.dot} Tip: ${Format.inlineCode('/nowplaying')} trae controles (botones).`)
  }
  if (cat.key === 'economy') {
    extraTips.push(`${Emojis.dot} Tip: ${Format.inlineCode('/profile')} muestra cooldowns, seguridad y stream.`)
  }

  return embed({
    ui,
    system: 'info',
    kind: 'info',
    title: `${cat.emoji} Ayuda`,
    description: [
      `${Emojis.category} **Categoría:** ${Format.inlineCode(cat.label)}`,
      Format.softDivider(20),
      list,
      extraTips.length ? Format.softDivider(20) : null,
      extraTips.length ? extraTips.join('\n') : null
    ].filter(Boolean).join('\n'),
    signature: `Comandos: ${cmds.length}`
  })
}

module.exports = {
  HELP_CATEGORIES,
  matchesHelpCategory,
  buildHelpHomeEmbed,
  buildHelpCategoryEmbed
}

