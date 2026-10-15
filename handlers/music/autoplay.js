const { allowedMusicTrack } = require('./nodes-config')

function titleKey(value) {
  return String(value || '').normalize('NFKD').toLowerCase()
    .replace(/\([^)]*(?:official|lyrics?|audio|video)[^)]*\)|\[[^\]]*(?:official|lyrics?|audio|video)[^\]]*\]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

async function findAutoplayTrack(music, guildId, seed, history, isCurrent) {
  const info = seed.info || seed
  const artist = String(info.author || '').replace(/\s+-\s+Topic$/i, '').trim()
  const recent = [seed, ...history].map(track => track.info || track)
  const uris = new Set(recent.map(track => track.uri).filter(Boolean))
  const titles = new Set(recent.map(track => titleKey(track.title)).filter(Boolean))
  const queries = [...new Set([artist, `${info.title || ''} ${artist} mix`.trim()].filter(Boolean))]
  for (const query of queries) {
    if (!isCurrent()) return null
    const result = await music.search(query, 'Autoplay', { guildId }).catch(() => null)
    if (!isCurrent()) return null
    const candidates = (result?.tracks || []).filter(track => allowedMusicTrack(track) && track.encoded && track.info?.uri &&
      !uris.has(track.info.uri) && !titles.has(titleKey(track.info.title)))
    if (candidates.length) return candidates[Math.floor(Math.random() * Math.min(8, candidates.length))]
  }
  return null
}

module.exports = { findAutoplayTrack }
