export interface Guild { id: string; name: string; iconUrl: string | null; memberCount: number | null }
export interface PanelContext { user: { id: string; name: string; avatarUrl: string | null }; guilds: Guild[]; csrfToken: string }
export interface Track { title: string; author: string; artworkUrl: string | null; length: number; elapsed: number }
export interface PlayerState {
  active: boolean; paused: boolean; sessionId: string | null; playbackId: string | null;
  revision: number; updatedAt: number; current: Track | null; queue: Track[]; historyLength: number;
  volume: number; playbackRate: number; clockRunning: boolean;
}
const record = (value: unknown): Record<string, unknown> | null => value !== null && typeof value === 'object' ? value as Record<string, unknown> : null
const number = (value: unknown, fallback = 0) => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback
export function imageURL(value: unknown): string | null {
  try { const url = new URL(String(value)); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null } catch { return null }
}
function track(value: unknown): Track | null {
  const data = record(value)
  if (!data || typeof data.title !== 'string' || typeof data.author !== 'string') return null
  return { title: data.title.slice(0, 256), author: data.author.slice(0, 256), artworkUrl: imageURL(data.artworkUrl), length: number(data.length), elapsed: number(data.elapsed) }
}
export function parsePlayer(value: unknown, guildId: string): PlayerState | null {
  const data = record(value)
  if (!data || typeof data.active !== 'boolean' || data.guildId && data.guildId !== guildId) return null
  const current = track(data.current)
  if (data.active && !current) return null
  return { active: data.active, paused: data.paused === true, sessionId: typeof data.sessionId === 'string' ? data.sessionId : null,
    playbackId: typeof data.playbackId === 'string' ? data.playbackId : null, revision: number(data.revision), updatedAt: number(data.updatedAt), current,
    queue: Array.isArray(data.queue) ? data.queue.slice(1, 6).map(track).filter((item): item is Track => item !== null) : [],
    historyLength: Array.isArray(data.history) ? data.history.length : 0, volume: Math.min(200, number(data.volume, 100)),
    playbackRate: number(data.playbackRate, 1) || 1, clockRunning: data.clockRunning === true }
}
export function isNewer(current: PlayerState | null, incoming: PlayerState): boolean {
  if (!current) return true
  if (incoming.updatedAt < current.updatedAt) return false
  return incoming.sessionId !== current.sessionId || incoming.revision >= current.revision
}
export function duration(ms: number): string {
  const seconds = Math.floor(number(ms) / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
