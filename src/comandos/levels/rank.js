const { AttachmentBuilder } = require('discord.js')
const canvacord = require('canvacord')
const UserSchema = require('../../database/schemas/UserSchema')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replySafe } = require('../../core/ui/messageKit')
const { getGuildUiConfig, embed, headerLine, warnEmbed } = require('../../core/ui/uiKit')
const { resolveMemberFromArgs } = require('../../core/commands/legacyArgs')

module.exports = {
  DESCRIPTION: 'Muestra tu rango (nivel/XP).',
  ALIASES: ['level', 'lvl'],
  async execute (client, message, args) {
    const resolved = await resolveMemberFromArgs({ message, args, index: 0 })
    const user = resolved.user || message.author
    const userData = await UserSchema.findOne({ userID: user.id })

    const ui = await getGuildUiConfig(client, message.guild.id)

    if (!userData) {
      const e = warnEmbed({
        ui,
        system: 'levels',
        title: 'Sin datos',
        lines: ['Este usuario no tiene datos de nivel aún.']
      })
      return replySafe(message, { embeds: [e] })
    }

    const nextLevelXP = (Number(userData.level || 0) || 1) * (Number(userData.level || 0) || 1) * 100

    const rank = new canvacord.Rank()
      .setAvatar(user.displayAvatarURL({ extension: 'png' }))
      .setCurrentXP(Number(userData.xp || 0))
      .setRequiredXP(nextLevelXP)
      .setStatus('online')
      .setProgressBar('#FFFFFF', 'COLOR')
      .setUsername(user.username)
      .setDiscriminator(user.discriminator || '0000')
      .setLevel(Number(userData.level || 0))
      .setRank(1, 'RANK', false)

    const data = await rank.build()
    const attachment = new AttachmentBuilder(data, { name: 'rank.png' })

    const e = embed({
      ui,
      system: 'levels',
      kind: 'info',
      title: `${Emojis.level} Rank`,
      description: [
        headerLine(Emojis.level, 'Progreso'),
        `${Emojis.member} Usuario: **${user.tag || user.username}**`,
        `${Emojis.stats} Nivel: ${Format.inlineCode(userData.level)}`,
        `${Emojis.stats} XP: ${Format.inlineCode(`${userData.xp} / ${nextLevelXP}`)}`
      ].join('\n'),
      image: 'attachment://rank.png',
      signature: 'Sigue subiendo'
    })

    return replySafe(message, { embeds: [e], files: [attachment] })
  }
}
