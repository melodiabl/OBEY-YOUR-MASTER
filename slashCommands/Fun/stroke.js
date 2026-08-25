const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'stroke',
  description: 'Bart Simpson escribiendo en el pizarrón con tu texto',
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
    const url     = `https://api.memegen.link/images/bs/${encoded}/_.png`

    await interaction.reply({
      embeds: [
        new EmbedBuilder().setColor(0xF59E0B)
          .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
          .setImage(url),
      ],
    })
  },
}
