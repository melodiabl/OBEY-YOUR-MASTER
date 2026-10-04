const fs = require('node:fs')
const path = require('node:path')
const { createHash } = require('node:crypto')
const contract = require('../../assets/obey/registry.json')
const musicKeys = require('../../assets/obey/music-keys.json')
const root = path.resolve(__dirname, '../../assets/obey')
const fallbacks = { play: '▶️', pause: '⏸️', skip: '⏭️', stop: '⏹️', previous: '⏮️', shuffle: '🔀', repeat: '🔁', lyrics: '🎵', vol_down: '🔉', vol_up: '🔊', queue: '📋', heart: '💛', autoplay: '🎶', success: '✅', error: '❌', warning: '⚠️', user: '👤', history: '🕒', link: '🔗', decoration: '🎉', back: '◀️', next: '▶️', delete: '🗑️', info: 'ℹ️', home: '🏠', globe: '🌐', document: '📄', live: '📡', help: '❓', edit: '✏️', music: '🎶' }
const snowflake = value => typeof value === 'string' && /^[1-9]\d{16,19}$/.test(value)
function assetPath(key, kind = 'icons', format = 'png') {
  const entry = Object.hasOwn(contract, kind) && Object.hasOwn(contract[kind], key) && contract[kind][key]
  const relative = entry && Object.hasOwn(entry, format) && entry[format]
  if (typeof relative !== 'string') throw new Error(`Unknown asset: ${kind}/${key}/${format}`)
  const resolved = path.resolve(root, relative)
  if (!resolved.startsWith(root + path.sep)) throw new Error('Asset path escapes registry')
  return resolved
}
const hashes = new Map()
function assetHash(key) {
  if (!hashes.has(key)) hashes.set(key, createHash('sha256').update(fs.readFileSync(assetPath(key))).digest('hex'))
  return hashes.get(key)
}
function emojiName(key, sha256) { return `obey_${key}_${sha256.slice(0, 8)}` }
function createRegistry(map = {}, applicationId) {
  const matchingApplication = map && typeof map === 'object' && snowflake(applicationId) && map.applicationId === applicationId && map.version === 1
  function emoji(key) {
    if (!Object.hasOwn(contract.icons, key)) throw new Error(`Unknown asset: icons/${key}`)
    const candidate = matchingApplication && map.emojis && Object.hasOwn(map.emojis, key) && map.emojis[key]
    if (candidate && snowflake(candidate.id) && candidate.sha256 === assetHash(key) && candidate.name === emojiName(key, candidate.sha256) && candidate.animated === false) {
      return { id: candidate.id, name: candidate.name, animated: false }
    }
    return { name: fallbacks[key] || '▫️' }
  }
  function markup(key) {
    const resolved = emoji(key)
    return resolved.id ? `<:${resolved.name}:${resolved.id}>` : resolved.name
  }
  return { emoji, markup, musicEmoji: key => markup(musicKeys[key]) }
}
function loadRegistry() {
  const file = process.env.OBEY_EMOJI_MAP_FILE || path.join(root, 'application-emojis.json')
  let map = {}
  try { map = JSON.parse(fs.readFileSync(file, 'utf8')) }
  catch (error) { if (error.code !== 'ENOENT') console.warn('[Assets] Emoji map unavailable; using Unicode fallbacks') }
  const applicationId = process.env.DISCORD_CLIENT_ID || require('../../botconfig/config.json').clientid
  return createRegistry(map, applicationId)
}
const registry = loadRegistry()
module.exports = { contract, musicKeys, assetPath, assetHash, emojiName, snowflake, createRegistry, registry }
