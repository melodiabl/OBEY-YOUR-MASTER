const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'serverbanner',
  description: 'Muestra el banner del servidor',

  run: async (client, interaction) => {
    const guild = interaction.guild

    if (!guild.banner)
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Este servidor no tiene banner.')],
        ephemeral: true,
      })

    const bannerURL = guild.bannerURL({ size: 4096 })
    await interaction.reply({
      embeds: [
        new EmbedBuilder().setColor(0x5865F2)
          .setTitle(`🖼️ Banner de ${guild.name}`)
          .setDescription(`[Descargar (4K)](${bannerURL})`)
          .setImage(bannerURL),
      ],
    })
  },
}
