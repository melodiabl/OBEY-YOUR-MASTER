const GuildSchema = require('../../database/schemas/GuildSchema')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { getGuildUiConfig, embed, headerLine } = require('../../core/ui/uiKit')

function isModuleEnabled (guildData, key) {
  const modules = guildData?.modules
  if (!modules) return true
  if (typeof modules.get === 'function') return modules.get(key) !== false
  return modules?.[key] !== false
}

async function getGuildData (client, guildID) {
  try {
    if (client?.db?.getGuildData) return await client.db.getGuildData(guildID)
  } catch (e) {}
  return GuildSchema.findOne({ guildID }).catch(() => null)
}

function accountAgeLine (member) {
  const ts = Math.floor(Number(member?.user?.createdTimestamp || 0) / 1000)
  if (!ts) return null
  return `${Emojis.dot} **Cuenta:** <t:${ts}:R>`
}

class WelcomeService {
  async handleJoin (member) {
    const client = member?.client
    if (!client || !member?.guild) return

    const guildData = await getGuildData(client, member.guild.id)
    if (!guildData?.welcomeChannel) return
    if (!isModuleEnabled(guildData, 'welcome')) return

    const channel = member.guild.channels.cache.get(guildData.welcomeChannel)
    if (!channel?.send) return

    const ui = await getGuildUiConfig(client, member.guild.id)

    const banner = member.guild.bannerURL?.({ size: 1024 })
    const avatar = member.user.displayAvatarURL({ size: 512 })

    const e = embed({
      ui,
      system: 'announcements',
      kind: 'success',
      title: `${Emojis.success} ¡Bienvenido/a!`,
      description: [
        headerLine(Emojis.notifications, 'Nueva llegada'),
        `${Emojis.dot} ${member.user} ${Format.italic(`(${member.user.tag})`)}`,
        `${Emojis.dot} **Servidor:** ${Format.bold(member.guild.name)}`,
        `${Emojis.dot} **Miembros:** ${Format.inlineCode(member.guild.memberCount)}`,
        accountAgeLine(member)
      ].filter(Boolean).join('\n'),
      thumbnail: avatar,
      image: banner || undefined,
      footer: `ID: ${member.id}`,
      signature: '𓆩♡𓆪 Disfruta de tu estadía 𓆩♡𓆪'
    })

    await channel.send({ embeds: [e] }).catch(() => {})
  }

  async handleLeave (member) {
    const client = member?.client
    if (!client || !member?.guild) return

    const guildData = await getGuildData(client, member.guild.id)
    if (!guildData?.welcomeChannel) return
    if (!isModuleEnabled(guildData, 'welcome')) return

    const channel = member.guild.channels.cache.get(guildData.welcomeChannel)
    if (!channel?.send) return

    const ui = await getGuildUiConfig(client, member.guild.id)
    const avatar = member.user.displayAvatarURL({ size: 512 })

    const e = embed({
      ui,
      system: 'announcements',
      kind: 'warn',
      title: `${Emojis.warn} Un miembro se fue`,
      description: [
        headerLine(Emojis.notifications, 'Salida'),
        `${Emojis.dot} **Usuario:** ${Format.bold(member.user.tag)}`,
        `${Emojis.dot} **Miembros ahora:** ${Format.inlineCode(member.guild.memberCount)}`
      ].join('\n'),
      thumbnail: avatar,
      footer: `ID: ${member.id}`
    })

    await channel.send({ embeds: [e] }).catch(() => {})
  }
}

module.exports = new WelcomeService()

