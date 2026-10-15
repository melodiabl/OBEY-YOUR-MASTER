const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
const Playlist = require('../../database/schemas/PlaylistSchema')

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
    const playlists = await Playlist.find({ userId: interaction.user.id }).lean().catch(() => [])

    if (!playlists.length)
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xED4245)
          .setDescription(obeyUi.limit(obeyUi.owned('❌ No tienes ninguna playlist. Usa `/playlist create` para crear una.'), 4096))],
      })

    const lines = playlists.map((p, i) => {
      const total = p.tracks.reduce((a, t) => a + (t.duration || 0), 0)
      const dur   = total ? ` — ${obeyUi.markup("icon.clock")} \`${fmtMs(total)}\`` : ''
      const lock  = p.isPublic ? obeyUi.owned('🌐') : obeyUi.owned('🔒')
      return `\`${i + 1}.\` ${lock} **${p.name}** — ${p.tracks.length} canciones${dur}`
    })

    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(0x5865F2)
        .setTitle(obeyUi.limit(`${obeyUi.markup("icon.queue")} Tus playlists (${playlists.length})`, 256))
        .setDescription(obeyUi.limit(lines.join('\n'), 4096))
        .setFooter(obeyMeta.asFooter({ text: obeyUi.owned('🔒 Privada  ·  🌐 Pública') }))],
    })
  },
}
