const { EmbedBuilder } = require('discord.js')

module.exports = async (client, member) => {
  const { user } = member

  // Sistema de Auto-Rol
  const guildData = await client.db.getGuildData(member.guild.id)
  if (guildData && guildData.autoRole) {
    const role = member.guild.roles.cache.get(guildData.autoRole)
    if (role) {
      member.roles.add(role).catch(err => console.log(`Error al dar auto-rol: ${err}`))
    }
  }

  // Sistema de Bienvenidas (configurable, sin IDs hardcodeados)
  if (!guildData?.welcomeChannel) return
  const channel = member.guild.channels.cache.get(guildData.welcomeChannel)
  if (!channel) return

  channel.send({
    embeds: [
      new EmbedBuilder()
        .setAuthor({ name: member.guild.name, iconURL: member.guild.iconURL() })
        .setTitle('¡Bienvenido/a!')
        .setDescription(`Hola ${user}, bienvenido/a a **${member.guild.name}**.`)
        .setThumbnail(user.avatarURL({ forceStatic: false }))
        .setColor('#2b2d31')
        .setTimestamp()
    ]
  }).catch(() => {})
}
