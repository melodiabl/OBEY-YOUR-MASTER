const { EmbedBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  DESCRIPTION: 'Muestra tu saldo actual.',
  ALIASES: ['bal', 'money'],
  async execute (client, message, args) {
    const user = message.mentions.users.first() || message.author
    const userData = await client.db.getUserData(user.id)
    
    const embed = new EmbedBuilder()
      .setTitle(`${Emojis.economy} Saldo de ${user.username}`)
      .setColor('Gold')
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { 
          name: `${Emojis.money} Efectivo`, 
          value: Format.inlineCode(userData.money?.toLocaleString() || '0'), 
          inline: true 
        },
        { 
          name: `${Emojis.bank} Banco`, 
          value: Format.inlineCode(userData.bank?.toLocaleString() || '0'), 
          inline: true 
        },
        { 
          name: `${Emojis.stats} Total`, 
          value: Format.bold(((userData.money || 0) + (userData.bank || 0)).toLocaleString()), 
          inline: false 
        }
      )
      .setFooter({ text: `Consultado por ${message.author.tag}` })
      .setTimestamp()

    message.reply({ embeds: [embed] })
  }
}
