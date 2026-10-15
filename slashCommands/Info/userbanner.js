const obeyUi = require("../../handlers/assets/system")
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
        embeds: [new EmbedBuilder().setColor(0x71717A).setDescription(obeyUi.limit(`${obeyUi.markup("icon.error")} **${target.username}** no tiene banner de perfil.`, 4096))],
        ephemeral: true,
      })

    await interaction.reply({
      embeds: [
        new EmbedBuilder().setColor(0x5865F2)
          .setTitle(obeyUi.limit(`🖼️ Banner de ${target.username}`, 256))
          .setDescription(obeyUi.limit(`[Descargar (4K)](${bannerURL})`, 4096))
          .setThumbnail(target.displayAvatarURL())
          .setImage(bannerURL),
      ],
    })
  },
}
