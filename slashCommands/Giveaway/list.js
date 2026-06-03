const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'list',
  description: 'Ver todos los sorteos activos en este servidor',
  options: [],
  run: async (client, interaction) => {
    const giveaways = client.giveawaysManager.giveaways.filter(
      g => g.guildId === interaction.guild.id && !g.ended
    )
    if (!giveaways.length)
      return interaction.reply({ content: '📋 No hay sorteos activos en este servidor.', ephemeral: true })

    const embed = new EmbedBuilder()
      .setTitle('🎉 Sorteos Activos')
      .setColor('#FF4500')
      .setDescription(
        giveaways.map(g =>
          `**${g.prize}** — <#${g.channelId}>\n> Finaliza: <t:${Math.floor(g.endAt / 1000)}:R> | Ganadores: ${g.winnerCount} | [Mensaje](https://discord.com/channels/${g.guildId}/${g.channelId}/${g.messageId})`
        ).join('\n\n')
      )
      .setFooter({ text: `${giveaways.length} sorteo(s) activo(s)` })
      .setTimestamp()

    await interaction.reply({ embeds: [embed], ephemeral: true })
  },
}
