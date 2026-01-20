const { EmbedBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  DESCRIPTION: 'Muestra la lista de comandos.',
  ALIASES: ['ayuda', 'h'],
  async execute (client, message, args) {
    const embed = new EmbedBuilder()
      .setTitle(`${Emojis.crown} OBEY YOUR MASTER - Ayuda`)
      .setColor('Gold')
      .setDescription(`Hola ${message.author.username}, aquí tienes mis categorías de comandos:`)
      .addFields(
        { name: `${Emojis.info} Información`, value: '`ping`, `serverinfo`, `help`', inline: true },
        { name: `${Emojis.economy} Economía`, value: '`balance`, `work`, `daily`, `profile`', inline: true },
        { name: `${Emojis.music} Música`, value: '`play`, `skip`, `stop`, `queue`', inline: true },
        { name: `${Emojis.system} Sistemas`, value: '`sistemas`', inline: true }
      )
      .setFooter({ text: 'Usa / (Slash commands) para una mejor experiencia' })
      .setTimestamp()

    message.reply({ embeds: [embed] })
  }
}
