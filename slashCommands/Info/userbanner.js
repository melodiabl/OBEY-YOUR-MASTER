const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'userbanner',
  description: 'Muestra el banner de un usuario',
  options: [
    { User: { name: 'usuario', description: 'Usuario (por defecto tú)', required: false } },
  ],

  run: async (client, interaction) => {
    const target = interaction.options.getUser('usuario') || interaction.user

    // Need to fetch the user to get banner data
    const fetched = await client.users.fetch(target.id, { force: true }).catch(() => null)
    const bannerURL = fetched?.bannerURL({ size: 4096 }) ?? null

    if (!bannerURL)
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x71717A).setDescription(`❌ **${target.username}** no tiene banner de perfil.`)],
        ephemeral: true,
      })

    await interaction.reply({
      embeds: [
        new EmbedBuilder().setColor(0x5865F2)
          .setTitle(`🖼️ Banner de ${target.username}`)
          .setDescription(`[Descargar (4K)](${bannerURL})`)
          .setThumbnail(target.displayAvatarURL())
          .setImage(bannerURL),
      ],
    })
  },
}
