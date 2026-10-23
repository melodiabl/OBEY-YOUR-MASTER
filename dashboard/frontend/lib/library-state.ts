import { imageURL } from './player-state'
export interface LibraryTrack { key: string; title: string; author: string; uri: string | null; artworkUrl: string | null; length: number; isStream: boolean; playable: boolean; playCount: number }
export interface Playlist { id: string; name: string; automatic: boolean; trackCount: number }
export interface LibrarySnapshot { userId: string; guildId: string; liked: LibraryTrack[]; playlists: Playlist[]; recent: LibraryTrack[]; top: { tracks: LibraryTrack[]; users: { suffix: string; playCount: number }[] } }
export interface PlaylistDetail extends Playlist { tracks: LibraryTrack[] }
const object = (value: unknown): Record<string, unknown> | null => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
const count = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
function track(value: unknown): LibraryTrack | null {
  const row = object(value)
  if (!row || typeof row.key !== 'string' || row.key.length > 8192 || typeof row.title !== 'string' || typeof row.author !== 'string' || typeof row.length !== 'number' || !Number.isFinite(row.length) || row.length < 0 || !count(row.playCount)) return null
  let uri: string | null = null
  try { const url = new URL(String(row.uri)); if (['https:', 'http:'].includes(url.protocol) && !url.username && !url.password && url.href.length <= 2048) uri = url.href } catch {}
  return { key: row.key, title: row.title.slice(0, 256), author: row.author.slice(0, 256), uri, artworkUrl: imageURL(row.artworkUrl), length: row.length,
    isStream: row.isStream === true, playable: row.playable === true && !!uri, playCount: row.playCount }
}
function playlist(value: unknown): Playlist | null {
  const row = object(value)
  if (!row || typeof row.id !== 'string' || row.id !== 'liked' && !/^[a-f0-9]{24}$/i.test(row.id) || typeof row.name !== 'string' || !count(row.trackCount) || typeof row.automatic !== 'boolean' || row.automatic !== (row.id === 'liked')) return null
  return { id: row.id, name: row.name.slice(0, 256), automatic: row.automatic, trackCount: row.trackCount }
}
function list<T>(value: unknown, parse: (value: unknown) => T | null): T[] | null {
  if (!Array.isArray(value)) return null
  const values = value.map(parse)
  return values.some(item => item === null) ? null : values as T[]
}
function envelope(value: unknown, userId: string, guildId: string) {
  const response = object(value), data = object(response?.data)
  return response?.success === true && data?.userId === userId && data.guildId === guildId ? data : null
}
export function parseLibrary(value: unknown, userId: string, guildId: string): LibrarySnapshot | null {
  const data = envelope(value, userId, guildId), top = object(data?.top)
  if (!data || !top) return null
  const liked = list(data.liked, track), recent = list(data.recent, track), playlists = list(data.playlists, playlist), tracks = list(top.tracks, track)
  const users = list(top.users, value => { const row = object(value); return row && typeof row.suffix === 'string' && row.suffix.length > 0 && row.suffix.length <= 4 && count(row.playCount) ? { suffix: row.suffix, playCount: row.playCount } : null })
  if (!liked || !recent || !playlists || !tracks || !users || playlists.filter(item => item.id === 'liked').length !== 1 || new Set(playlists.map(item => item.id)).size !== playlists.length) return null
  return { userId, guildId, liked, playlists, recent, top: { tracks, users } }
}
export function parsePlaylist(value: unknown, userId: string, guildId: string, id: string): PlaylistDetail | null {
  const data = envelope(value, userId, guildId), raw = object(data?.playlist), summary = playlist(raw), tracks = list(raw?.tracks, track)
  return summary && summary.id === id && !summary.automatic && tracks ? { ...summary, tracks } : null
}
export function filterTracks(tracks: LibraryTrack[], query: string) {
  const text = query.trim().toLocaleLowerCase('es')
  return text ? tracks.filter(track => `${track.title} ${track.author}`.toLocaleLowerCase('es').includes(text)) : tracks
}
