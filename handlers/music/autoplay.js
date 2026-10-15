const { lookupWithTimeout } = require('./resolve-timeout')
const { allowedMusicTrack } = require('./nodes-config')

function titleKey(value) {
  return String(value || '').normalize('NFKD').toLowerCase()
    .replace(/\([^)]*(?:official|lyrics?|audio|video)[^)]*\)|\[[^\]]*(?:official|lyrics?|audio|video)[^\]]*\]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

async function findAutoplayTrack(music, guildId, seed, history, isCurrent, signal) {
  const info = seed.info || seed
  const artist = String(info.author || '').replace(/\s+-\s+Topic$/i, '').trim()
  const encoded = new Set([seed, ...history].map(track => track.encoded).filter(Boolean))
  const recent = [seed, ...history].map(track => track.info || track)
  const uris = new Set(recent.map(track => track.uri).filter(Boolean))
  const titles = new Set(recent.map(track => titleKey(track.title)).filter(Boolean))
  const queries = [...new Set([artist, `${info.title || ''} ${artist} mix`.trim()].filter(Boolean))]
  for (const query of queries) {
    if (!isCurrent()) return null
    const result = await lookupWithTimeout(() => music.search(query, 'Autoplay', { guildId, signal }), 12000, signal).catch(() => null)
    if (!isCurrent()) return null
    const candidates = (result?.tracks || []).filter(track => allowedMusicTrack(track) && track.encoded && track.info?.uri &&
      !encoded.has(track.encoded) && !uris.has(track.info.uri) && !titles.has(titleKey(track.info.title)))
    if (candidates.length) return candidates[Math.floor(Math.random() * Math.min(8, candidates.length))]
  }
  return null
}

module.exports = { findAutoplayTrack }
