const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
const Playlist = require('../../database/schemas/PlaylistSchema')
const { getLikedPlaylist } = require('../../handlers/music/liked-playlist')

function fmtMs(ms) {
  const s = Math.floor((ms || 0) / 1000)
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

module.exports = {
  name: 'list',
  description: 'Ver todas tus playlists',
  options: [],
  run: async (client, interaction) => {
    await interaction.deferReply({ ephemeral: true })
    const [saved, liked] = await Promise.all([
      Playlist.find({ userId: interaction.user.id }).lean(),
      getLikedPlaylist(interaction.user.id),
    ])
    const playlists = [liked, ...saved]

    const lines = playlists.map((p, i) => {
      const total = p.tracks.reduce((a, t) => a + (t.duration || 0), 0)
      const dur   = total ? ` — ${obeyUi.markup("icon.clock")} \`${fmtMs(total)}\`` : ''
      const lock  = p.isPublic ? obeyUi.owned('🌐') : obeyUi.owned('🔒')
      return `\`${i + 1}.\` ${lock} **${p.name}** — ${p.tracks.length} canciones${dur}${p.automatic ? ' · Automática' : ''}`
    })

    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(0x5865F2)
        .setTitle(obeyUi.limit(`${obeyUi.markup("icon.queue")} Tus playlists (${playlists.length})`, 256))
        .setDescription(obeyUi.limit(lines.join('\n') + '\n\nAbre tus corazones con `/playlist show nombre: Tus Me gusta` o escúchalos con `/playlist play nombre: Tus Me gusta`.', 4096))
        .setFooter(obeyMeta.asFooter({ text: obeyUi.owned('🔒 Privada  ·  🌐 Pública') }))],
    })
  },
}
