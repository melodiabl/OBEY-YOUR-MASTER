const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
const ModerationCaseSchema = require('../../database/schemas/ModerationCaseSchema')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { headerLine } = require('../../core/ui/uiKit')
const { replyEmbed, replyWarn } = require('../../core/ui/interactionKit')

function clamp (n, min, max) {
  const x = Number(n)
  if (!Number.isFinite(x)) return min
  return Math.max(min, Math.min(max, x))
}

function tsRel (d) {
  const t = new Date(d).getTime()
  if (!Number.isFinite(t) || t <= 0) return '—'
  return `<t:${Math.floor(t / 1000)}:R>`
}

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('warns-all')
    .setDescription('Muestra warns del servidor (top y recientes)')
    .addStringOption(o => o
      .setName('modo')
      .setDescription('Vista')
      .setRequired(false)
      .addChoices(
        { name: 'top (por usuario)', value: 'top' },
        { name: 'recent (últimos warns)', value: 'recent' }
      ))
    .addIntegerOption(o => o
      .setName('limite')
      .setDescription('Cantidad a mostrar (max 25)')
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(25))
    .addIntegerOption(o => o
      .setName('dias')
      .setDescription('Filtra por últimos N días (default 30)')
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(365))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute (client, interaction) {
    const mode = interaction.options.getString('modo') || 'top'
    const limit = clamp(interaction.options.getInteger('limite') || 10, 1, 25)
    const days = clamp(interaction.options.getInteger('dias') || 30, 1, 365)

    const guildID = interaction.guild.id
    const since = new Date(Date.now() - (days * 24 * 60 * 60 * 1000))

    if (mode === 'recent') {
      const rows = await ModerationCaseSchema.find({ guildID, type: 'warn', createdAt: { $gte: since } })
        .sort({ createdAt: -1 })
        .limit(limit)

      if (!rows.length) {
        return replyWarn(client, interaction, {
          system: 'moderation',
          title: 'Sin warns',
          lines: [`No hay warns en los últimos **${days}** días.`],
          signature: `Tip: usa ${Format.inlineCode('/warn')} para crear uno`
        }, { ephemeral: true })
      }

      const lines = rows.map((c) => {
        const reason = String(c.reason || 'Sin razón.').slice(0, 120)
        return [
          `${Emojis.dot} ${Format.bold(`#${c.caseNumber}`)} ${tsRel(c.createdAt)} ${Format.inlineCode('warn')}`,
          `${Emojis.dot} Usuario: <@${c.targetID}>  ${Emojis.dot} Mod: <@${c.moderatorID}>`,
          `${Emojis.quote} ${Format.italic(reason)}`
        ].join('\n')
      })

      return replyEmbed(client, interaction, {
        system: 'moderation',
        kind: 'info',
        title: `${Emojis.moderation} Warns (recientes)`,
        description: [
          headerLine(Emojis.moderation, `Últimos ${limit}`),
          `${Emojis.dot} Filtro: últimos **${days}** días`,
          Format.softDivider(20),
          lines.join('\n\n')
        ].join('\n'),
        signature: `Detalle: ${Format.inlineCode('/mod-history')} · Usuario: ${Format.inlineCode('/warns')}`
      }, { ephemeral: true })
    }

    const agg = await ModerationCaseSchema.aggregate([
      { $match: { guildID, type: 'warn', createdAt: { $gte: since } } },
      {
        $group: {
          _id: '$targetID',
          count: { $sum: 1 },
          lastAt: { $max: '$createdAt' }
        }
      },
      { $sort: { count: -1, lastAt: -1 } },
      { $limit: limit }
    ])

    if (!agg.length) {
      return replyWarn(client, interaction, {
        system: 'moderation',
        title: 'Sin warns',
        lines: [`No hay warns en los últimos **${days}** días.`],
        signature: `Tip: mira casos con ${Format.inlineCode('/mod-history')}`
      }, { ephemeral: true })
    }

    const lines = agg.map((r, i) => {
      return `${Emojis.dot} ${Format.bold(`#${i + 1}`)} <@${r._id}> — ${Format.inlineCode(String(r.count))} warns ${Format.subtext(`último: ${tsRel(r.lastAt)}`)}`
    })

    return replyEmbed(client, interaction, {
      system: 'moderation',
      kind: 'info',
      title: `${Emojis.moderation} Warns (top)`,
      description: [
        headerLine(Emojis.moderation, `Top ${limit}`),
        `${Emojis.dot} Filtro: últimos **${days}** días`,
        Format.softDivider(20),
        lines.join('\n')
      ].join('\n'),
      signature: `Cambiar vista: ${Format.inlineCode('/warns-all modo:recent')}`
    }, { ephemeral: true })
  }
}
