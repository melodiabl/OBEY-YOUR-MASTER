const { SlashCommandBuilder } = require('discord.js')
const { rejectMarriage } = require('../../utils/marriageManager')
const { replyError, replyOk } = require('../../core/ui/interactionKit')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('reject')
    .setDescription('Rechaza una propuesta de matrimonio pendiente'),
  async execute (client, interaction) {
    const ok = rejectMarriage(interaction.user.id)

    if (!ok) {
      return replyError(client, interaction, {
        system: 'fun',
        reason: 'No tienes propuestas de matrimonio pendientes.'
      }, { ephemeral: true })
    }

    return replyOk(client, interaction, {
      system: 'fun',
      title: 'Propuesta rechazada',
      lines: ['Has rechazado la propuesta de matrimonio.']
    }, { ephemeral: true })
  }
}
