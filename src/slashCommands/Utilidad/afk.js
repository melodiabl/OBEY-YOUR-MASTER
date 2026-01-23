const { SlashCommandBuilder } = require('discord.js')
const systems = require('../../systems')
const Format = require('../../utils/formatter')
const { replyOk } = require('../../core/ui/interactionKit')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('afk')
    .setDescription('Establece tu estado AFK')
    .addStringOption(option =>
      option.setName('razon')
        .setDescription('La razón de tu estado AFK')
        .setRequired(false)),

  async execute (client, interaction) {
    const reason = interaction.options.getString('razon') || 'AFK'
    await systems.afk.setAfk(interaction.user.id, reason)

    return replyOk(client, interaction, {
      system: 'notifications',
      title: 'AFK activado',
      lines: [
        `Razón: ${Format.quote(reason)}`,
        'Cuando hables de nuevo, se desactivará automáticamente.'
      ],
      signature: 'Modo AFK'
    })
  }
}
