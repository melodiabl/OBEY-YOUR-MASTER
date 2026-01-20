const { EmbedBuilder } = require('discord.js')
const { randomAnswer } = require('../../helpers/helpers')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  DESCRIPTION: 'Hazle una pregunta hipotética al bot.',
  ALIASES: ['wi', 'pregunta'],
  async execute (client, message, args) {
    const texto = args.join(' ')
    if (!texto) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`${Emojis.error} Falta la pregunta`)
            .setDescription(Format.quote('Debes introducir un texto para que pueda predecir el futuro.'))
            .setColor('Red')
        ]
      })
    }

    const embed = new EmbedBuilder()
      .setAuthor({ name: `Pregunta de ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setTitle(`🤔 ¿Qué pasaría si...?`)
      .setDescription(`${Format.bold('Pregunta:')}\n${Format.quote(texto)}\n\n${Format.bold('Respuesta:')}\n${randomAnswer()}`)
      .setThumbnail('https://emojipedia-us.s3.amazonaws.com/source/skype/289/pool-8-ball_1f3b1.png')
      .setColor('Blurple')
      .setFooter({ text: 'Predicción del Maestro' })
      .setTimestamp()

    await message.reply({ embeds: [embed] })
  }
}
