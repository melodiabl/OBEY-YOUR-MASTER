const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyOk, replyError } = require('../../core/ui/messageKit')

module.exports = {
  DESCRIPTION: 'Recarga módulos del bot (owner).',
  OWNER: true,
  async execute (client, message, args) {
    let scope = 'Comandos, Eventos y Handlers'

    try {
      const mode = String(args?.[0] || '').trim().toLowerCase()
      switch (mode) {
        case 'comands':
        case 'comandos':
          scope = 'Comandos (prefix)'
          await client.loadCommands()
          break
        case 'slash':
        case 'slashcommands':
          scope = 'Comandos Slash'
          await client.loadSlashCommands()
          break
        case 'eventos':
        case 'events':
          scope = 'Eventos'
          await client.loadEvents()
          break
        case 'handlers':
          scope = 'Handlers'
          await client.loadHandlers()
          break
        default:
          await client.loadEvents()
          await client.loadHandlers()
          await client.loadSlashCommands()
          await client.loadCommands()
          break
      }

      return replyOk(client, message, {
        system: 'infra',
        title: `${Emojis.success} Recarga completa`,
        lines: [
          `${Emojis.dot} **Scope:** ${Format.inlineCode(scope)}`,
          `${Emojis.dot} Slash: ${Format.inlineCode(client.slashCommands.size)}`,
          `${Emojis.dot} Prefix: ${Format.inlineCode(client.commands.size)}`
        ],
        signature: 'Hot reload listo'
      })
    } catch (e) {
      console.log(e)
      return replyError(client, message, {
        system: 'infra',
        title: 'Falló la recarga',
        reason: e?.message || 'Error desconocido.',
        hint: `${Emojis.dot} Revisa la consola del host.`
      })
    }
  }
}

