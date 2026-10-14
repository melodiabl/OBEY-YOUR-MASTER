const fs = require('node:fs')
const net = require('node:net')
const ADULT_SOURCES = new Set(['pornhub', 'soundgasm', 'hentai', 'nsfw'])
const MUSIC_SOURCES = new Set(['youtube', 'ytdlp', 'spotify', 'soundcloud', 'bandcamp', 'deezer', 'applemusic', 'tidal', 'jiosaavn', 'qobuz', 'yandexmusic', 'audiomack', 'audius', 'netease', 'amazonmusic', 'gaana', 'pandora', 'iheartradio', 'mixcloud', 'ocremix', 'http'])
function assertMusicQuery(value) {
  if (typeof value !== 'string' || !value.trim() || value.length > 2000) throw new Error('invalid_music_query')
  const query = value.trim()
  if (/^(?:tts|speak|ftts|flowerytts|reddit|tiktok|clypit|yarn):/i.test(query)) throw new Error('source_not_allowed')
  if (/^(?:pornhub|phsearch|soundgasm|hentai|nsfw):/i.test(query)) throw new Error('source_not_allowed')
  if (/^https?:\/\//i.test(query)) {
    const host = new URL(query).hostname.toLowerCase()
    if (/(^|\.)(?:pornhub\.(?:com|org)|soundgasm\.net|xvideos\.com|xnxx\.com|redtube\.com|youporn\.com)$/.test(host)) throw new Error('source_not_allowed')
  }
  return query
}
function allowedMusicTrack(track) {
  const info = track?.info || track
  const source = String(info?.sourceName || '').toLowerCase()
  if (ADULT_SOURCES.has(source) || source && !MUSIC_SOURCES.has(source) || info?.isExplicit === true || info?.explicit === true || track?.pluginInfo?.isExplicit === true || track?.pluginInfo?.explicit === true || info?.nsfw === true) return false
  try { if (info?.uri) assertMusicQuery(info.uri); return true } catch { return false }
}
function validateNodes(values) {
  if (!Array.isArray(values) || values.length > 20) throw new Error('invalid_node_registry')
  const ids = new Set()
  return Object.freeze(values.map((value, index) => {
    if (!value || typeof value !== 'object') throw new Error('invalid_node')
    const id = value.id
    if (typeof id !== 'string' || !/^[a-z][a-z0-9-]{1,40}$/.test(id) || ids.has(id)) throw new Error('invalid_node_id')
    ids.add(id)
    if (!['private', 'public'].includes(value.visibility)) throw new Error('invalid_node_visibility')
    if (value.visibility === 'public' && id.startsWith('private-')) throw new Error('reserved_node_id')
    const host = value.host
    if (typeof host !== 'string' || host.length > 253 || !/^[a-zA-Z0-9.:-]+$/.test(host) || (!net.isIP(host) && !/^[a-zA-Z0-9]+(?:[.-][a-zA-Z0-9]+)*$/.test(host))) throw new Error('invalid_node_host')
    const port = Number(value.port || (value.secure ? 443 : 2333))
    if (value.port === 0 || !Number.isInteger(port) || port < 1 || port > 65535) throw new Error('invalid_node_port')
    if (typeof value.secure !== 'boolean' || value.visibility === 'public' && !value.secure) throw new Error('public_node_requires_tls')
    if (typeof value.password !== 'string' || !value.password.trim() || value.password.length > 2048) throw new Error('missing_node_credentials')
    if (value.label !== undefined && (typeof value.label !== 'string' || !value.label.trim() || value.label.length > 60)) throw new Error('invalid_node_label')
    const priority = value.priority ?? index + 10
    if (!Number.isFinite(priority) || priority < 0 || priority > 1000) throw new Error('invalid_node_priority')
    return Object.freeze({ id, name: id, label: value.label || id, url: (net.isIP(host) === 6 ? '[' + host + ']' : host) + ':' + port,
      auth: value.password, secure: value.secure, visibility: value.visibility, priority, enabled: value.enabled !== false })
  }))
}
function loadNodeConfig({ env = process.env, legacyNodes = [], readFile = file => fs.readFileSync(file, 'utf8') } = {}) {
  const values = []
  const privateEnabled = String(env.LAVALINK_PRIVATE_ENABLED ?? 'true').toLowerCase()
  if (!['true', 'false'].includes(privateEnabled)) throw new Error('invalid_private_node_setting')
  if (privateEnabled === 'true' && env.LAVALINK_HOST) values.push({ id: 'private-primary', label: 'Principal interno', host: env.LAVALINK_HOST, port: Number(env.LAVALINK_PORT || 2333), password: env.LAVALINK_PASSWORD,
    secure: String(env.LAVALINK_SECURE || 'false').toLowerCase() === 'true', visibility: 'private', priority: 0 })
  else if (privateEnabled === 'true') for (const [index, node] of legacyNodes.entries()) values.push({ id: 'private-' + index, label: 'Interno', host: node.host, port: Number(node.port || 2333), password: node.password,
    secure: typeof node.secure === 'string' ? node.secure.toLowerCase() === 'true' : Boolean(node.secure), visibility: 'private', priority: index })
  if (env.LAVALINK_NODES_FILE) {
    const text = readFile(env.LAVALINK_NODES_FILE)
    if (Buffer.byteLength(text) > 100000) throw new Error('node_registry_too_large')
    const registry = JSON.parse(text)
    if (registry.version !== 1 || !Array.isArray(registry.nodes)) throw new Error('invalid_node_registry_version')
    values.push(...registry.nodes)
  }
  return validateNodes(privateEnabled === 'true' ? values : values.filter(node => node.visibility === 'public'))
}
module.exports = { validateNodes, loadNodeConfig, assertMusicQuery, allowedMusicTrack }
