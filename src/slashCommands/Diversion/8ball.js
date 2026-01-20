const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { EIGHTBALL, pick } = require('../../systems/fun/funContent')
const Emojis = require('../../utils/emojis')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Pregúntale algo a la bola mágica')
    .addStringOption(option => 
      option.setName('pregunta')
        .setDescription('La pregunta que quieres hacer')
        .setRequired(true)
    ),

  async execute (client, interaction) {
    const question = interaction.options.getString('pregunta')
    const response = pick(EIGHTBALL)

    const embed = new EmbedBuilder()
      .setTitle('🎱 La Bola Mágica')
      .addFields(
        { name: `${Emojis.dot} Tu Pregunta`, value: question },
        { name: `${Emojis.dot} Mi Respuesta`, value: response }
      )
      .setColor('DarkButNotBlack')
      .setFooter({ text: `Consultado por ${interaction.user.tag}` })
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  }
}
