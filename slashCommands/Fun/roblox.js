const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'roblox',
  description: 'Meme roblox de un usuario',
  options: [
    { User: { name: 'usuario', description: 'Usuario (por defecto tú)', required: false } },
  ],

  run: async (client, interaction) => {
    if (!client.settings.get(interaction.guild.id, 'FUN'))
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ El sistema de diversión no está activado.'), 4096))],
        ephemeral: true,
      })

    const user = interaction.options.getUser('usuario') || interaction.user

    await interaction.reply({
      embeds: [
        new EmbedBuilder().setColor(0xE23535)
          .setTitle(obeyUi.limit('🎮 ROBLOX', 256))
          .setDescription(obeyUi.limit(`**${user.username}** has left the game.`, 4096))
          .setThumbnail(user.displayAvatarURL())
          .setFooter(obeyMeta.asFooter({ text: 'ROBLOX' })),
      ],
    })
  },
}
