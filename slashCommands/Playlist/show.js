const { EmbedBuilder } = require('discord.js')
const Playlist = require('../../database/schemas/PlaylistSchema')

function fmtMs(ms) {
  const s = Math.floor((ms || 0) / 1000)
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

module.exports = {
  name: 'show',
  description: 'Ver las canciones de una playlist',
  options: [
    { String: { name: 'nombre', description: 'Nombre de la playlist', required: true } },
    {
      User: {
        name: 'usuario',
        description: 'Ver playlist pública de otro usuario (opcional)',
        required: false,
      },
    },
  ],
  run: async (client, interaction) => {
    const name       = interaction.options.getString('nombre').trim()
    const targetUser = interaction.options.getUser('usuario') || interaction.user
    const ownQuery   = targetUser.id === interaction.user.id

    await interaction.deferReply({ ephemeral: true })

    const playlist = await Playlist.findOne({
      userId: targetUser.id,
      name:   { $regex: new RegExp(`^${name}$`, 'i') },
    }).lean().catch(() => null)

    if (!playlist)
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xED4245)
          .setDescription(`❌ ${ownQuery ? 'No tienes una playlist' : `${targetUser.username} no tiene una playlist`} llamada **${name}**.`)],
      })

    if (!ownQuery && !playlist.isPublic)
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Esa playlist es privada.')],
      })

    if (!playlist.tracks.length)
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xF59E0B).setDescription(`⚠️ La playlist **${name}** está vacía.`)],
      })

    const PER_PAGE = 15
    const lines = playlist.tracks.slice(0, PER_PAGE).map((t, i) => {
      const dur  = t.duration ? ` — \`${fmtMs(t.duration)}\`` : ''
      const link = t.uri ? `[${(t.title || '?').substring(0, 48)}](${t.uri})` : (t.title || '?').substring(0, 48)
      return `\`${i + 1}.\` ${link}${dur}`
    })

    const total    = playlist.tracks.reduce((a, t) => a + (t.duration || 0), 0)
    const more     = playlist.tracks.length > PER_PAGE ? `\n_...y ${playlist.tracks.length - PER_PAGE} más_` : ''
    const owner    = ownQuery ? '' : ` — de ${targetUser.username}`

    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(0x1DB954)
        .setTitle(`📋 ${playlist.name}${owner}`)
        .setDescription(lines.join('\n') + more)
        .addFields(
          { name: '🎵 Canciones', value: String(playlist.tracks.length), inline: true },
          { name: '⏱ Duración',  value: `\`${fmtMs(total)}\``,          inline: true },
          { name: '🌐 Visibilidad', value: playlist.isPublic ? 'Pública' : 'Privada', inline: true },
        )],
    })
  },
}
