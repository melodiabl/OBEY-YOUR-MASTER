const { EmbedBuilder } = require('discord.js')
const formatter = require('../../utils/formatter')
const emojis = require('../../utils/emojis')

class SuggestionService {
  async handleSuggestion(interaction, suggestionText) {
    const GuildSchema = require('../../database/schemas/GuildSchema')
    const guildData = await GuildSchema.findOne({ guildID: interaction.guild.id })

    if (!guildData || !guildData.suggestionChannel) {
      return interaction.reply({ content: `${emojis.error} No se ha configurado un canal de sugerencias.`, ephemeral: true })
    }

    const channel = interaction.guild.channels.cache.get(guildData.suggestionChannel)
    if (!channel) return interaction.reply({ content: `${emojis.error} El canal de sugerencias no existe o no es accesible.`, ephemeral: true })

    const embed = new EmbedBuilder()
      .setAuthor({ name: `Sugerencia de ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
      .setTitle(`${emojis.quest} ${formatter.toBold('NUEVA SUGERENCIA')}`)
      .setDescription(formatter.quote(suggestionText))
      .setColor('#2b2d31')
      .addFields(
        { name: `${emojis.loading} Estado`, value: formatter.toBold('Pendiente'), inline: true },
        { name: `${emojis.human} Autor`, value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Vota usando las reacciones de abajo' })

    const suggestionMsg = await channel.send({ embeds: [embed] })
    await suggestionMsg.react('✅')
    await suggestionMsg.react('❌')

    return interaction.reply({ content: `${emojis.success} Tu sugerencia ha sido enviada a ${channel}.`, ephemeral: true })
  }
}

module.exports = new SuggestionService()
