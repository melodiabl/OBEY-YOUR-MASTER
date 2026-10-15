const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
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
          .setAuthor(obeyMeta.asAuthor({ name: guild.name, iconURL: guild.iconURL() ?? undefined }))
          .setTitle(obeyUi.limit(obeyUi.owned('👥 Conteo de Miembros'), 256))
          .addFields(
            { name: obeyUi.owned('📊 Total'),    value: `\`${total}\``,  inline: true },
            { name: obeyUi.owned('👤 Humanos'),  value: `\`${humans}\``, inline: true },
            { name: obeyUi.owned('🤖 Bots'),     value: `\`${bots}\``,   inline: true },
            { name: obeyUi.owned('🟢 En línea'), value: `\`${online}\``, inline: true },
          )
          .setFooter(obeyMeta.asFooter({ text: guild.name })),
      ],
    })
  },
}
