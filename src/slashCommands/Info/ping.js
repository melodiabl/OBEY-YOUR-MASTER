const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Muestra la latencia del bot'),
  async execute (client, interaction) {
    const ping = client.ws.ping
    let color = 'Green'
    if (ping > 200) color = 'Yellow'
    if (ping > 400) color = 'Red'

    const embed = new EmbedBuilder()
      .setTitle('🏓 Pong!')
      .setColor(color)
      .addFields(
        { 
          name: `${Emojis.stats} Latencia API`, 
          value: Format.inlineCode(`${ping}ms`), 
          inline: true 
        },
        { 
          name: `${Emojis.system} Estado`, 
          value: ping < 200 ? `${Emojis.success} Excelente` : `${Emojis.warn} Estable`, 
          inline: true 
        }
      )
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  }
}
