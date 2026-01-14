const { EmbedBuilder } = require('discord.js')
module.exports = {
  DESCRIPTION: 'Mostrar el avatar de un usuario',
  PERMISSIONS: [],
  async execute (client, message, args, prefix) {
    const usuario = message.mentions.members.first() || message.member

    const AvatarEmbed = new EmbedBuilder()
      .setTitle(`Avatar de ${usuario.user.username}`)
      .setImage(usuario.user.displayAvatarURL({ size: 1024, dynamic: true }))
      .setColor(process.env.COLOR || '#FF0000')

    message.reply({ embeds: [AvatarEmbed] })
  }
}
