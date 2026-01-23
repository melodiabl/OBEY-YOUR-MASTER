const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed } = require('../../core/ui/messageKit')
const { headerLine } = require('../../core/ui/uiKit')

function normalizeModules (raw) {
  if (!raw) return []
  if (typeof raw.get === 'function') {
    return [...raw.entries()].map(([k, v]) => ({ key: String(k), enabled: Boolean(v) }))
  }
  if (typeof raw === 'object') {
    return Object.entries(raw).map(([k, v]) => ({ key: String(k), enabled: Boolean(v) }))
  }
  return []
}

module.exports = {
  DESCRIPTION: 'Muestra el estado de los módulos del servidor.',
  ALIASES: ['mods', 'sistemas'],
  async execute (client, message, _args, _prefix, guildData) {
    const modules = normalizeModules(guildData?.modules)
      .sort((a, b) => a.key.localeCompare(b.key, 'en', { sensitivity: 'base' }))

    const lines = modules.length
      ? modules.slice(0, 30).map(m => `${Emojis.dot} ${Format.inlineCode(m.key)}: ${m.enabled ? `${Emojis.success} ON` : `${Emojis.error} OFF`}`)
      : [`${Emojis.dot} ${Format.italic('Este servidor no tiene overrides de módulos aún.')}`]

    return replyEmbed(client, message, {
      system: 'config',
      kind: 'info',
      title: `${Emojis.system} Módulos`,
      description: [
        headerLine(Emojis.system, 'Estado'),
        ...lines,
        modules.length > 30 ? `${Emojis.dot} ${Format.italic(`... y ${modules.length - 30} más`)}` : null,
        Format.softDivider(20),
        `${Emojis.dot} Gestiona todo con ${Format.inlineCode('/modules')} o ${Format.inlineCode('/panel')}.`
      ].filter(Boolean).join('\n'),
      signature: 'Sistema modular'
    })
  }
}
