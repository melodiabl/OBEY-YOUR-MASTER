const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js')

function fmt(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return String(n ?? 0)
}

module.exports = {
  name: 'leaderboard',
  description: 'Ver el top de niveles del servidor',
  options: [
    {
      StringChoices: {
        name: 'tipo',
        description: 'Tipo de ranking',
        required: false,
        choices: [
          ['Chat (texto)', 'text'],
          ['Voz',          'voice'],
        ],
      },
    },
  ],

  run: async (client, interaction) => {
    const type = interaction.options.getString('tipo') || 'text'
    const gid  = interaction.guild.id

    const levelKey  = type === 'voice' ? 'voicelevel'  : 'level'
    const pointsKey = type === 'voice' ? 'voicepoints' : 'points'

    const all = client.points
      .filter(p => p.guild === gid)
      .map(p => p)
      .sort((a, b) => (b[levelKey] - a[levelKey]) || (b[pointsKey] - a[pointsKey]))

    if (!all.length)
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x4f545c).setDescription('📊 Aún no hay datos de ranking en este servidor.')],
        ephemeral: true,
      })

    const PER_PAGE  = 10
    const pages     = Math.ceil(all.length / PER_PAGE)
    let   page      = 0

    const MEDALS = ['🥇', '🥈', '🥉']

    function buildEmbed(p) {
      const slice = all.slice(p * PER_PAGE, (p + 1) * PER_PAGE)
      const lines = slice.map((data, i) => {
        const pos    = p * PER_PAGE + i + 1
        const medal  = MEDALS[pos - 1] || `\`${pos}.\``
        const lvl    = data[levelKey]  ?? 1
        const pts    = data[pointsKey] ?? 0
        return `${medal} **${data.usertag || data.user}** — Nivel \`${lvl}\` · \`${fmt(pts)}\` pts`
      })

      // posición del usuario que usa el comando
      const myPos = all.findIndex(d => d.user === interaction.user.id)

      return new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`${type === 'voice' ? '🎙️ Ranking de Voz' : '💬 Ranking de Chat'} — ${interaction.guild.name}`)
        .setThumbnail(interaction.guild.iconURL())
        .setDescription(lines.join('\n'))
        .setFooter({ text: `Página ${p + 1}/${pages} · Tu posición: ${myPos >= 0 ? `#${myPos + 1}` : 'sin datos'}` })
    }

    function buildRow(p) {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('lb_prev').setLabel('◀').setStyle(ButtonStyle.Secondary).setDisabled(p === 0),
        new ButtonBuilder().setCustomId('lb_next').setLabel('▶').setStyle(ButtonStyle.Secondary).setDisabled(p >= pages - 1),
      )
    }

    const msg = await interaction.reply({
      embeds:     [buildEmbed(page)],
      components: pages > 1 ? [buildRow(page)] : [],
      fetchReply: true,
    })

    if (pages <= 1) return

    const coll = msg.createMessageComponentCollector({ filter: i => i.user.id === interaction.user.id, time: 60_000 })
    coll.on('collect', async i => {
      if (i.customId === 'lb_prev') page = Math.max(0, page - 1)
      if (i.customId === 'lb_next') page = Math.min(pages - 1, page + 1)
      await i.update({ embeds: [buildEmbed(page)], components: [buildRow(page)] })
    })
    coll.on('end', () => {
      interaction.editReply({ components: [] }).catch(() => {})
    })
  },
}
