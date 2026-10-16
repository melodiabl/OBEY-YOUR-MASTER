const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
const Playlist = require('../../database/schemas/PlaylistSchema')
const { exactPlaylistName } = require('../../handlers/music/playlist-name')
const { isLikedPlaylist, getLikedPlaylist } = require('../../handlers/music/liked-playlist')

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

    if (isLikedPlaylist(name) && !ownQuery)
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xED4245)
        .setDescription('Tus Me gusta es una lista privada. Solo su propietario puede verla.')] })

    const playlist = isLikedPlaylist(name) ? await getLikedPlaylist(interaction.user.id) : await Playlist.findOne({
      userId: targetUser.id,
      name: exactPlaylistName(name),
    }).lean().catch(() => null)

    if (!playlist)
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xED4245)
          .setDescription(obeyUi.limit(`${obeyUi.markup("icon.error")} ${ownQuery ? 'No tienes una playlist' : `${targetUser.username} no tiene una playlist`} llamada **${name}**.`, 4096))],
      })

    if (!ownQuery && !playlist.isPublic)
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ Esa playlist es privada.'), 4096))],
      })

    if (!playlist.tracks.length)
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xF59E0B).setDescription(obeyUi.limit(`${obeyUi.markup("icon.warning")} La playlist **${name}** está vacía.`, 4096))],
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
        .setTitle(obeyUi.limit(`${obeyUi.markup("icon.queue")} ${playlist.name}${owner}`, 256))
        .setDescription(obeyUi.limit(lines.join('\n') + more, 4096))
        .addFields(
          { name: obeyUi.owned('🎵 Canciones'), value: String(playlist.tracks.length), inline: true },
          { name: obeyUi.owned('⏱ Duración'),  value: `\`${fmtMs(total)}\``,          inline: true },
          { name: obeyUi.owned('🌐 Visibilidad'), value: playlist.isPublic ? 'Pública' : 'Privada', inline: true },
        )],
    })
  },
}
