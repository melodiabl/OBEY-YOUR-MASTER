const { EmbedBuilder } = require('discord.js')
const formatter = require('../../utils/formatter')
const emojis = require('../../utils/emojis')

class WelcomeService {
  async handleJoin(member) {
    const GuildSchema = require('../../database/schemas/GuildSchema')
    const guildData = await GuildSchema.findOne({ guildID: member.guild.id })

    if (!guildData || !guildData.welcomeChannel) return

    const channel = member.guild.channels.cache.get(guildData.welcomeChannel)
    if (!channel) return

    const embed = new EmbedBuilder()
      .setAuthor({ name: member.guild.name, iconURL: member.guild.iconURL() })
      .setTitle(`${emojis.success} ¡Bienvenido/a al servidor!`)
      .setDescription(`Hola ${member.user}, bienvenido/a a ${formatter.bold(member.guild.name)}.\n\n` +
        `${emojis.dot} ${formatter.toBold('Usuario:')} ${member.user.tag}\n` +
        `${emojis.dot} ${formatter.toBold('Miembros totales:')} ${member.guild.memberCount}`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
      .setColor('#2b2d31')
      .setImage(member.guild.bannerURL({ size: 1024 }) || null)
      .setTimestamp()
      .setFooter({ text: `ID: ${member.id}` })

    channel.send({ content: `¡Bienvenido/a ${member.user}!`, embeds: [embed] }).catch(() => {})
  }

  async handleLeave(member) {
    const GuildSchema = require('../../database/schemas/GuildSchema')
    const guildData = await GuildSchema.findOne({ guildID: member.guild.id })

    if (!guildData || !guildData.welcomeChannel) return

    const channel = member.guild.channels.cache.get(guildData.welcomeChannel)
    if (!channel) return

    const embed = new EmbedBuilder()
      .setAuthor({ name: member.guild.name, iconURL: member.guild.iconURL() })
      .setTitle(`${emojis.error} Un miembro nos ha dejado`)
      .setDescription(`${formatter.bold(member.user.tag)} ha abandonado el servidor.\n` +
        `Ahora somos ${formatter.bold(member.guild.memberCount)} miembros.`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
      .setColor('Red')
      .setTimestamp()

    channel.send({ embeds: [embed] }).catch(() => {})
  }
}

module.exports = new WelcomeService()
