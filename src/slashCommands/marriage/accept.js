const { SlashCommandBuilder } = require('discord.js')
const { acceptMarriage } = require('../../utils/marriageManager')
const Emojis = require('../../utils/emojis')
const { replyError, replyOk } = require('../../core/ui/interactionKit')
const Format = require('../../utils/formatter')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('accept')
    .setDescription('Acepta una propuesta de matrimonio pendiente'),
  async execute (client, interaction) {
    const result = await acceptMarriage(interaction.user.id, client.db)

    if (!result.ok) {
      return replyError(client, interaction, {
        system: 'fun',
        reason: result.message || 'No tienes propuestas pendientes.'
      }, { ephemeral: true })
    }

    return replyOk(client, interaction, {
      system: 'fun',
      title: 'Propuesta aceptada',
      lines: [
        `${Emojis.dot} ${interaction.user} y <@${result.proposerId}> ahora están casados.`,
        `${Emojis.crown} ${Format.italic('Una nueva pareja ha nacido.')}`
      ],
      signature: 'Romance system'
    })
  }
}
