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
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ El sistema de diversión no está activado.')],
        ephemeral: true,
      })

    const user = interaction.options.getUser('usuario') || interaction.user

    await interaction.reply({
      embeds: [
        new EmbedBuilder().setColor(0xE23535)
          .setTitle('🎮 ROBLOX')
          .setDescription(`**${user.username}** has left the game.`)
          .setThumbnail(user.displayAvatarURL())
          .setFooter({ text: 'ROBLOX' }),
      ],
    })
  },
}
