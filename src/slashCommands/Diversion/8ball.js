const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Pregúntale algo a la bola mágica')
    .addStringOption(option => option.setName('pregunta').setDescription('Tu pregunta').setRequired(true)),

  async execute (client, interaction) {
    const question = interaction.options.getString('pregunta')
    const responses = [
      'Sí.', 'No.', 'Tal vez.', 'Probablemente.', 'No lo sé.',
      'Claro que sí.', 'Ni lo sueñes.', 'Pregunta más tarde.',
      'Mis fuentes dicen que no.', 'Definitivamente.', 'No puedo predecirlo ahora.'
    ]
    const response = responses[Math.floor(Math.random() * responses.length)]

    const embed = new EmbedBuilder()
      .setTitle('🎱 La Bola Mágica')
      .addFields(
        { name: 'Pregunta', value: question },
        { name: 'Respuesta', value: response }
      )
      .setColor('Random')
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  }
}
