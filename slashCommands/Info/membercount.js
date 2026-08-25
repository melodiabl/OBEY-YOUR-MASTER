const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'membercount',
  description: 'Muestra el conteo de miembros del servidor',

  run: async (client, interaction) => {
    const guild = interaction.guild
    await guild.members.fetch().catch(() => {})

    const total   = guild.memberCount
    const humans  = guild.members.cache.filter(m => !m.user.bot).size
    const bots    = guild.members.cache.filter(m => m.user.bot).size
    const online  = guild.members.cache.filter(m => m.presence?.status && m.presence.status !== 'offline').size

    await interaction.reply({
      embeds: [
        new EmbedBuilder().setColor(0x5865F2)
          .setAuthor({ name: guild.name, iconURL: guild.iconURL() ?? undefined })
          .setTitle('👥 Conteo de Miembros')
          .addFields(
            { name: '📊 Total',    value: `\`${total}\``,  inline: true },
            { name: '👤 Humanos',  value: `\`${humans}\``, inline: true },
            { name: '🤖 Bots',     value: `\`${bots}\``,   inline: true },
            { name: '🟢 En línea', value: `\`${online}\``, inline: true },
          )
          .setFooter({ text: guild.name }),
      ],
    })
  },
}
