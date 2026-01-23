const { ChannelType } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed, replyError } = require('../../core/ui/messageKit')
const { headerLine } = require('../../core/ui/uiKit')

module.exports = {
  DESCRIPTION: 'Muestra información detallada sobre el servidor.',
  ALIASES: ['sv', 'server'],
  BOT_PERMISSIONS: ['ViewChannel'],
  async execute (client, message) {
    try {
      const { guild } = message
      const owner = await guild.fetchOwner().catch(() => null)

      const emojis = guild.emojis.cache
      const animatedEmojis = emojis.filter(e => e.animated).size

      const totalMembers = guild.memberCount
      const bots = guild.members.cache.filter(m => m.user.bot).size
      const humans = totalMembers - bots

      const channels = guild.channels.cache
      const textChannels = channels.filter(c => [ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildForum].includes(c.type)).size
      const voiceChannels = channels.filter(c => [ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(c.type)).size
      const categories = channels.filter(c => c.type === ChannelType.GuildCategory).size

      const icon = guild.iconURL({ size: 1024 })
      const banner = guild.bannerURL?.({ size: 1024 })

      const fields = [
        {
          name: `${Emojis.owner} Propietario`,
          value: owner ? `${owner}\n${Format.subtext(owner.id)}` : Format.italic('No disponible'),
          inline: true
        },
        { name: `${Emojis.calendar} Creado`, value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
        { name: `${Emojis.id} Server ID`, value: Format.inlineCode(guild.id), inline: true },
        {
          name: `${Emojis.channel} Canales`,
          value: [
            `${Emojis.dot} ${Format.bold('Texto:')} ${Format.inlineCode(textChannels)}`,
            `${Emojis.dot} ${Format.bold('Voz:')} ${Format.inlineCode(voiceChannels)}`,
            `${Emojis.dot} ${Format.bold('Categorías:')} ${Format.inlineCode(categories)}`
          ].join('\n'),
          inline: true
        },
        {
          name: `${Emojis.member} Miembros`,
          value: [
            `${Emojis.dot} ${Format.bold('Humanos:')} ${Format.inlineCode(humans)}`,
            `${Emojis.dot} ${Format.bold('Bots:')} ${Format.inlineCode(bots)}`
          ].join('\n'),
          inline: true
        },
        {
          name: `${Emojis.boost} Boost`,
          value: [
            `${Emojis.dot} ${Format.bold('Nivel:')} ${Format.inlineCode(guild.premiumTier)}`,
            `${Emojis.dot} ${Format.bold('Boosts:')} ${Format.inlineCode(guild.premiumSubscriptionCount || 0)}`
          ].join('\n'),
          inline: true
        },
        {
          name: `${Emojis.stats} Otros`,
          value: [
            `${Emojis.dot} ${Format.bold('Roles:')} ${Format.inlineCode(guild.roles.cache.size)}`,
            `${Emojis.dot} ${Format.bold('Emojis:')} ${Format.inlineCode(emojis.size)} ${Format.subtext(`${animatedEmojis} anim.`)}`,
            `${Emojis.dot} ${Format.bold('Verificación:')} ${Format.inlineCode(guild.verificationLevel)}`
          ].join('\n'),
          inline: true
        }
      ]

      return replyEmbed(client, message, {
        system: 'info',
        kind: 'info',
        title: `${Emojis.info} Server Info`,
        description: [
          headerLine(Emojis.info, guild.name),
          guild.description ? `${Emojis.quote} ${Format.italic(guild.description)}` : null
        ].filter(Boolean).join('\n'),
        thumbnail: icon || undefined,
        image: banner || undefined,
        fields,
        signature: 'Estado premium'
      })
    } catch (e) {
      console.error(e)
      return replyError(client, message, {
        system: 'info',
        title: 'No pude obtener la info del servidor',
        reason: 'Ocurrió un error consultando datos de Discord.',
        hint: 'Reintenta en unos segundos.'
      })
    }
  }
}

