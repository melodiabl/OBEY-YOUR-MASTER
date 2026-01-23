const { SlashCommandBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyOk, replyError } = require('../../core/ui/interactionKit')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('reload')
    .setDescription('Recarga eventos/handlers/comandos (solo OWNER)'),
  OWNER: true,
  async execute (client, interaction) {
    try {
      await client.loadEvents()
      await client.loadHandlers()
      await client.loadCommands()
      await client.loadSlashCommands()

      return replyOk(client, interaction, {
        system: 'infra',
        title: `${Emojis.success} Recarga completa`,
        lines: [
          `${Emojis.dot} Slash: ${Format.inlineCode(client.slashCommands.size)}`,
          `${Emojis.dot} Prefix: ${Format.inlineCode(client.commands.size)}`,
          `${Emojis.dot} Plugins: ${Format.inlineCode(client.plugins?.size ?? 0)}`
        ],
        signature: 'Hot reload listo'
      }, { ephemeral: true })
    } catch (e) {
      return replyError(client, interaction, {
        system: 'infra',
        title: 'Falló la recarga',
        reason: e?.message || String(e || 'Error desconocido.'),
        hint: `${Emojis.dot} Revisa la consola del host.`
      }, { ephemeral: true })
    }
  }
}

