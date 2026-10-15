'use strict'
const { registry } = require('../assets/registry')
const platforms = {
 youtube: { name: 'YouTube', color: 0xFF0000, key: 'brand.youtube', hosts: ['youtube.com', 'youtu.be'] },
 youtubemusic: { name: 'YouTube Music', color: 0xFF0000, key: 'brand.youtubemusic', hosts: ['music.youtube.com'] },
 spotify: { name: 'Spotify', color: 0x1ED760, key: 'brand.spotify', hosts: ['spotify.com'] },
 applemusic: { name: 'Apple Music', color: 0xFA243C, key: 'brand.applemusic', hosts: ['music.apple.com'] },
 soundcloud: { name: 'SoundCloud', color: 0xFF5500, key: 'brand.soundcloud', hosts: ['soundcloud.com'] },
 deezer: { name: 'Deezer', color: 0xA238FF, key: 'brand.deezer', hosts: ['deezer.com'] },
 jiosaavn: { name: 'JioSaavn', color: 0x2BC5B4, key: 'brand.jiosaavn', hosts: ['jiosaavn.com', 'saavn.com'] },
 twitch: { name: 'Twitch', color: 0x9146FF, key: 'brand.twitch', hosts: ['twitch.tv'] },
 bandcamp: { name: 'Bandcamp', color: 0x408294, key: 'brand.bandcamp', hosts: ['bandcamp.com'] },
}
const aliases = { yt: 'youtube', ytmusic: 'youtubemusic', youtube_music: 'youtubemusic', apple: 'applemusic', saavn: 'jiosaavn' }
function platform(uri = '', sourceName = '', assets = registry) {
 const source = String(sourceName || '').toLowerCase()
 let key = Object.hasOwn(platforms, source) ? source : Object.hasOwn(aliases, source) ? aliases[source] : null
 {
  let hostname = ''
  try { const url = new URL(uri); if (['https:', 'http:'].includes(url.protocol)) hostname = url.hostname.toLowerCase() } catch {}
  // The specific Music host takes precedence over the broader YouTube host.
  key = ['youtubemusic', ...Object.keys(platforms).filter(k => k !== 'youtubemusic')].find(k => platforms[k].hosts.some(host => hostname === host || hostname.endsWith('.' + host))) || key
 }
 if (!key) return { name: 'Audio', color: 0x8795AF, key: 'icon.music', emoji: assets.markup('icon.music'), imageURL: assets.imageURL('icon.music') }
 const value = platforms[key]
 return { name: value.name, color: value.color, key: value.key, emoji: assets.emoji(value.key).id ? assets.markup(value.key) : '', imageURL: assets.imageURL(value.key) }
}
module.exports = { platform, platforms }
