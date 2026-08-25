const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'userid',
  description: 'Muestra el ID de un usuario',
  options: [
    { User: { name: 'usuario', description: 'Usuario (por defecto tú)', required: false } },
  ],

  run: async (client, interaction) => {
    const user = interaction.options.getUser('usuario') || interaction.user
    await interaction.reply({
      embeds: [
        new EmbedBuilder().setColor(0x5865F2)
          .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
          .setDescription(`🪪 ID: \`${user.id}\``)
          .setFooter({ text: 'Haz clic en el ID para copiarlo' }),
      ],
    })
  },
}
