const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { randomAnswer } = require('../../helpers/helpers')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('whatif')
    .setDescription('Hazle una pregunta hipotética al bot')
    .addStringOption(option =>
      option.setName('pregunta')
        .setDescription('La pregunta que quieres hacer')
        .setRequired(true)),

  async execute (client, interaction) {
    const texto = interaction.options.getString('pregunta')

    const embed = new EmbedBuilder()
      .setAuthor({ name: `Pregunta de ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
      .setTitle(Format.title('🤔', '¿Qué pasaría si...?'))
      .setDescription(`${Format.bold('Pregunta:')}\n${Format.quote(texto)}\n\n${Format.bold('Respuesta:')}\n${randomAnswer()}`)
      .setThumbnail('https://emojipedia-us.s3.amazonaws.com/source/skype/289/pool-8-ball_1f3b1.png')
      .setColor('Blurple')
      .setFooter({ text: 'Predicción del Maestro', iconURL: client.user.displayAvatarURL() })
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  }
}
