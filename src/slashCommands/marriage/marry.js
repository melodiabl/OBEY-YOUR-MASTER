const { SlashCommandBuilder } = require('discord.js')
const { proposeMarriage } = require('../../utils/marriageManager')
module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('marry')
    .setDescription('Propone matrimonio a otro usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario al que quieres proponer matrimonio')
        .setRequired(true)
    ),
  async execute (client, interaction) {
    const user = interaction.options.getUser('usuario')
    const result = await proposeMarriage(interaction.user.id, user.id)
    if (!result.ok) {
      return interaction.reply({ content: '❌ No se pudo proponer matrimonio. Verifica si ambos están solteros.', ephermal: true })
    }
    await interaction.reply(`💍 ${interaction.user} ha propuesto matrimonio a ${user}!`)
  }
}
