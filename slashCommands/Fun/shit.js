const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'shit',
  description: 'This is shit meme con tu texto',
  options: [
    { String: { name: 'texto', description: 'Texto del meme', required: true } },
  ],

  run: async (client, interaction) => {
    if (!client.settings.get(interaction.guild.id, 'FUN'))
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ El sistema de diversión no está activado.')],
        ephemeral: true,
      })

    const text    = interaction.options.getString('texto')
    const encoded = encodeURIComponent(text.replace(/\s+/g, '_'))
    const url     = `https://api.memegen.link/images/facepalm/${encoded}/_.png`

    await interaction.reply({
      embeds: [
        new EmbedBuilder().setColor(0x8B4513)
          .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
          .setImage(url),
      ],
    })
  },
}
