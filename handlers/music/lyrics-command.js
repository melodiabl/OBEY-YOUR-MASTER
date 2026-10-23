const { fetchLyricsResult } = require('./lyrics')
const { getCurrentLyrics } = require('./web-lyrics')
const { showLyrics } = require('./lyrics-pagination')
const { err } = require('./responses')
const { localeFor, t } = require('../i18n')

async function runLyrics(client, interaction, query = '', { currentLookup = getCurrentLyrics, lookup = fetchLyricsResult } = {}) {
  const guildId = interaction.guildId || interaction.guild?.id
  const locale = localeFor(client, guildId)
  const reply = key => interaction.editReply({ content: '', embeds: [err(t(locale, 'music.' + key))], components: [], allowedMentions: { parse: [] } })
  let title, artist, text, isCurrent = () => true
  try {
    if (query.trim()) {
      const parts = query.trim().split(' - ')
      title = parts.length > 1 ? parts.slice(1).join(' - ') : parts[0]
      artist = parts.length > 1 ? parts[0] : ''
      const result = await lookup(title, artist)
      if (result.status !== 'ready') return reply(result.status === 'unavailable' ? 'lyricsUnavailable' : 'lyricsMissing')
      text = result.data?.plain || result.data?.lines?.map(line => line.text).join('\n')
    } else {
      const state = client.music?.getState(guildId), track = state?.currentTrack
      if (!track) return reply('noCurrentTrack')
      const playbackId = state.playbackId, sessionId = state.sessionId
      isCurrent = () => {
        const latest = client.music?.getState(guildId)
        return latest?.currentTrack === track && latest.playbackId === playbackId && latest.sessionId === sessionId
      }
      const result = await currentLookup(client.music, guildId)
      if (!isCurrent() || result.status === 'track_changed') return reply('lyricsTrackChanged')
      if (result.status !== 'ready') return reply(result.status === 'stream' ? 'lyricsStream' : result.status === 'unavailable' ? 'lyricsUnavailable' : 'lyricsMissing')
      title = result.title || (track.info || track).title
      artist = result.author || (track.info || track).author
      text = result.text
    }
    if (!text) return reply('lyricsMissing')
    return showLyrics(interaction, { text, title, artist, isCurrent })
  } catch { return reply('lyricsUnavailable') }
}

module.exports = { runLyrics }
