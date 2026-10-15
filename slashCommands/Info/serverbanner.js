const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'serverbanner',
  description: 'Muestra el banner del servidor',

  run: async (client, interaction) => {
    const guild = interaction.guild

    if (!guild.banner)
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ Este servidor no tiene banner.'), 4096))],
        ephemeral: true,
      })

    const bannerURL = guild.bannerURL({ size: 4096 })
    await interaction.reply({
      embeds: [
        new EmbedBuilder().setColor(0x5865F2)
          .setTitle(obeyUi.limit(`🖼️ Banner de ${guild.name}`, 256))
          .setDescription(obeyUi.limit(`[Descargar (4K)](${bannerURL})`, 4096))
          .setImage(bannerURL),
      ],
    })
  },
}
