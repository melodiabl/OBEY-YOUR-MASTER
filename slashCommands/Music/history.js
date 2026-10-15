const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
const MusicHistory = require('../../database/schemas/MusicHistorySchema')

function fmtMs(ms) {
  const s = Math.floor((ms || 0) / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

module.exports = {
  name: 'history',
  description: 'Muestra el historial de canciones reproducidas en el servidor',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  options: [
    {
      Integer: {
        name: 'limite',
        description: 'Cantidad de canciones a mostrar (máx 20)',
        required: false,
        minValue: 1,
        maxValue: 20,
      },
    },
  ],
  run: async (client, interaction) => {
    const err = d => new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(d, 4096))
    await interaction.deferReply()

    const limit = Math.min(20, Math.max(1, interaction.options.getInteger('limite') || 10))

    const records = await MusicHistory.find({ guildId: interaction.guild.id })
      .sort({ lastPlayed: -1 })
      .limit(limit)
      .lean()
      .catch(() => [])

    if (!records.length) {
      return interaction.editReply({ embeds: [err(obeyUi.owned('❌ No hay historial de reproducción para este servidor.'))] })
    }

    const lines = records.map((r, i) => {
      const dur  = r.length ? ` — \`${fmtMs(r.length)}\`` : ''
      const plays = r.plays > 1 ? ` _(×${r.plays})_` : ''
      const link = r.uri ? `[${(r.title || '?').substring(0, 48)}](${r.uri})` : (r.title || '?').substring(0, 48)
      return `\`${i + 1}.\` ${obeyUi.markup("icon.music")} ${link}${dur}${plays}`
    })

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(obeyUi.limit(`${obeyUi.markup("icon.queue")} Historial de reproducción — ${interaction.guild.name}`, 256))
      .setDescription(obeyUi.limit(lines.join('\n'), 4096))
      .setFooter(obeyMeta.asFooter({ text: `Mostrando las últimas ${records.length} canciones` }))

    await interaction.editReply({ embeds: [embed] })
  },
}
