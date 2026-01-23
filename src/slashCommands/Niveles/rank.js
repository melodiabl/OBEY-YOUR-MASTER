const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js')
const canvacord = require('canvacord')
const UserSchema = require('../../database/schemas/UserSchema')
const { replyWarn } = require('../../core/ui/interactionKit')
const { getGuildUiConfig, embed, headerLine } = require('../../core/ui/uiKit')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Muestra tu nivel y experiencia actual')
    .addUserOption(option => option.setName('usuario').setDescription('Usuario para ver su rango')),

  async execute (client, interaction) {
    const user = interaction.options.getUser('usuario') || interaction.user
    const userData = await UserSchema.findOne({ userID: user.id })

    if (!userData) {
      return replyWarn(client, interaction, {
        system: 'levels',
        title: 'Sin datos',
        lines: ['Este usuario no tiene datos de nivel aún.']
      }, { ephemeral: true })
    }

    const level = Number(userData.level || 1)
    const xp = Number(userData.xp || 0)
    const nextLevelXP = level * level * 100

    let rankPos = 1
    let totalUsers = null
    try {
      const higher = await UserSchema.countDocuments({
        $or: [
          { level: { $gt: level } },
          { level, xp: { $gt: xp } }
        ]
      })
      rankPos = Number(higher || 0) + 1
      totalUsers = await UserSchema.countDocuments({})
    } catch (e) {}

    const rank = new canvacord.Rank()
      .setAvatar(user.displayAvatarURL({ extension: 'png' }))
      .setCurrentXP(xp)
      .setRequiredXP(nextLevelXP)
      .setStatus('online')
      .setProgressBar('#FFFFFF', 'COLOR')
      .setUsername(user.username)
      .setDiscriminator(user.discriminator || '0000')
      .setLevel(level)
      .setRank(rankPos, 'RANK', false)

    const data = await rank.build()
    const attachment = new AttachmentBuilder(data, { name: 'rank.png' })

    const ui = await getGuildUiConfig(client, interaction.guild.id)
    const pct = totalUsers ? Math.max(1, Math.min(100, Math.round((1 - ((rankPos - 1) / totalUsers)) * 100))) : null
    const e = embed({
      ui,
      system: 'levels',
      kind: 'info',
      title: `${Emojis.level} Rank`,
      description: [
        headerLine(Emojis.level, 'Progreso'),
        `${Emojis.member} Usuario: **${user.tag || user.username}**`,
        `${Emojis.stats} Nivel: ${Format.inlineCode(level)}`,
        `${Emojis.stats} XP: ${Format.inlineCode(`${xp} / ${nextLevelXP}`)}`,
        `${Emojis.dot} Barra: ${Format.progressBar(Math.min(xp, nextLevelXP), nextLevelXP || 1, 15)}`,
        `${Emojis.dot} Posición: ${Format.inlineCode('#' + rankPos)}${pct ? ` (${Format.bold(`Top ${pct}%`)})` : ''}`
      ].join('\n'),
      image: 'attachment://rank.png',
      signature: 'Sigue subiendo (premium)'
    })

    await interaction.reply({ embeds: [e], files: [attachment] })
  }
}
