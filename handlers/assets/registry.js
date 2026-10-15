const { entryFor } = require('./production')
const fs = require('node:fs')
const path = require('node:path')
const { createHash } = require('node:crypto')
const contract = require('../../assets/obey/registry.json')
const musicKeys = require('../../assets/obey/music-keys.json')
const root = path.resolve(__dirname, '../../assets/obey')
const fallbacks = { play: '▶️', pause: '⏸️', skip: '⏭️', stop: '⏹️', previous: '⏮️', shuffle: '🔀', repeat: '🔁', lyrics: '🎵', vol_down: '🔉', vol_up: '🔊', queue: '📋', heart: '💛', autoplay: '🎶', success: '✅', error: '❌', warning: '⚠️', user: '👤', history: '🕒', link: '🔗', decoration: '🎉', back: '◀️', next: '▶️', delete: '🗑️', info: 'ℹ️', home: '🏠', globe: '🌐', document: '📄', live: '📡', help: '❓', edit: '✏️', music: '🎶' }
const snowflake = value => typeof value === 'string' && /^[1-9]\d{16,19}$/.test(value)
const digest = buffer => createHash('sha256').update(buffer).digest('hex')
const selected = contract.selected
const uploadPlans = new Map(selected.uploadPlan.map(entry => [entry.key, entry]))
function canonicalKey(key) {
  const canonical = Object.hasOwn(selected.aliases, key) ? selected.aliases[key] : key
  if (!Object.hasOwn(selected.assets, canonical)) throw new Error(`Unknown asset: ${key}`)
  return canonical
}
function selectedAsset(key, destination = 'discordVariant') {
  key = canonicalKey(key)
  const entry = selected.assets[key]
  const variant = Object.hasOwn(entry.destinations, destination) && entry.destinations[destination]
  const file = variant && Object.hasOwn(entry.files, variant) && entry.files[variant]
  if (!file) throw new Error(`Unknown asset destination: ${key}/${destination}`)
  const filename = path.resolve(root, file.path)
  if (!filename.startsWith(root + path.sep)) throw new Error('Asset path escapes registry')
  const extension = path.extname(filename)
  const plan = uploadPlans.get(key)
  return { ...file, key, kind: entry.kind, fixtureOnly: entry.fixtureOnly, variant, path: filename,
    mimeType: { '.png': 'image/png', '.gif': 'image/gif', '.svg': 'image/svg+xml' }[extension],
    animated: extension === '.gif', name: plan?.variant === variant ? plan.name : undefined, storageKey: plan?.storageKey }
}
function assetPath(key, kind = 'icons', format = 'png') {
  const entry = Object.hasOwn(contract, kind) && Object.hasOwn(contract[kind], key) && contract[kind][key]
  const relative = entry && Object.hasOwn(entry, format) && entry[format]
  if (typeof relative !== 'string') throw new Error(`Unknown asset: ${kind}/${key}/${format}`)
  const resolved = path.resolve(root, relative)
  if (!resolved.startsWith(root + path.sep)) throw new Error('Asset path escapes registry')
  return resolved
}
function assetHash(key) {
  return digest(fs.readFileSync(assetPath(key)))
}
function emojiName(key, sha256) { return `obey_${key}_${sha256.slice(0, 8)}` }
function createRegistry(map = {}, applicationId) {
  const matchingApplication = map && typeof map === 'object' && snowflake(applicationId) && map.applicationId === applicationId && [1, 2].includes(map.version)
  let available
  function usable(candidate) {
    if (!candidate || !snowflake(candidate.id) || candidate.available === false) return false
    if (!available) return true
    const remote = available.get(candidate.id)
    return remote && remote.name === candidate.name && remote.animated === candidate.animated && remote.available !== false
  }
  function emoji(key) {
    const canonical = canonicalKey(key)
    const plan = uploadPlans.get(canonical)
    const candidate = matchingApplication && map.emojis && Object.hasOwn(map.emojis, canonical) && map.emojis[canonical]
    if (candidate) {
      try {
        const file = selectedAsset(canonical)
        if (plan && usable(candidate) && candidate.sha256 === file.sha256 && candidate.name === file.name && candidate.animated === file.animated && digest(fs.readFileSync(file.path)) === file.sha256) {
          return { id: candidate.id, name: candidate.name, animated: candidate.animated }
        }
      } catch { /* Missing/changed resources must never break a labelled control. */ }
    } else {
      // Keep verified v1 resources until a canonical replacement has been synced.
      const legacy = matchingApplication && (map.version === 1 ? map.emojis : map.legacyEmojis)
      const aliases = Object.entries(selected.aliases).filter(([, target]) => target === canonical).map(([alias]) => alias)
      if (aliases.includes(key)) {
        aliases.splice(aliases.indexOf(key), 1)
        aliases.unshift(key)
      }
      for (const alias of aliases) {
        const previous = legacy && Object.hasOwn(legacy, alias) && legacy[alias]
        try {
          if (usable(previous) && previous.sha256 === assetHash(alias) && previous.name === emojiName(alias, previous.sha256) && previous.animated === false) {
            return { id: previous.id, name: previous.name, animated: false }
          }
        } catch { /* Unavailable legacy file: fall back instead of resurrecting its ID. */ }
      }
    }
    const fallbackKey = selected.assets[canonical].fallback
    return { name: entryFor(canonical)?.fallback || fallbacks[key] || fallbacks[fallbackKey] || ({ loop: '🔁', like: '💛', 'volume-down': '🔉', 'volume-up': '🔊', cargando: '⏳', exito: '✅', error: '❌' }[fallbackKey]) || '▫️' }
  }
  function markup(key) {
    const resolved = emoji(key)
    return resolved.id ? `<${resolved.animated ? 'a' : ''}:${resolved.name}:${resolved.id}>` : resolved.name
  }
  function reconcile(emojis) {
    if (!Array.isArray(emojis)) throw new Error('Invalid application emoji list')
    const next = new Map()
    for (const emoji of emojis) {
      if (!snowflake(emoji?.id) || next.has(emoji.id)) throw new Error('Invalid application emoji list')
      next.set(emoji.id, { ...emoji })
    }
    available = next
  }
  function imageURL(key) {
    const resolved = emoji(key)
    return resolved.id ? `https://cdn.discordapp.com/emojis/${resolved.id}.${resolved.animated ? 'gif' : 'png'}` : undefined
  }
  return { emoji, markup, reconcile, imageURL, musicEmoji: key => markup(musicKeys[key]) }
}
const configuredApplicationId = process.env.DISCORD_CLIENT_ID || require('../../botconfig/config.json').clientid
function loadRegistry() {
  const file = process.env.OBEY_EMOJI_MAP_FILE || path.join(root, 'application-emojis.json')
  let map = {}
  try { map = JSON.parse(fs.readFileSync(file, 'utf8')) }
  catch (error) { if (error.code !== 'ENOENT') console.warn('[Assets] Emoji map unavailable; using Unicode fallbacks') }
  return createRegistry(map, configuredApplicationId)
}
const registry = loadRegistry()
module.exports = { contract, musicKeys, assetPath, assetHash, selectedAsset, canonicalKey, emojiName, snowflake, configuredApplicationId, createRegistry, registry }
