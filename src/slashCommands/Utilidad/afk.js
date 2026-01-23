const { SlashCommandBuilder } = require('discord.js')
const systems = require('../../systems')
const emojis = require('../../utils/emojis')
const formatter = require('../../utils/formatter')

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

    await interaction.reply({
      content: `${emojis.success} ${formatter.toBold('ESTADO AFK ESTABLECIDO')}\n${emojis.dot} ${formatter.toBold('Razón:')} ${formatter.italic(reason)}`,
      ephemeral: false
    })
  }
}
