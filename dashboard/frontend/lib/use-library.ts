'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, request } from './api'
import { parseLibrary, parsePlaylist, type LibrarySnapshot, type LibraryTrack, type PlaylistDetail } from './library-state'
export function useLibrary(userId: string, guildId: string, csrfToken: string, playlistId: string | null) {
  const [data, setData] = useState<LibrarySnapshot | null>(null), [detail, setDetail] = useState<PlaylistDetail | null>(null)
  const [loading, setLoading] = useState(true), [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState(''), [detailError, setDetailError] = useState(''), [status, setStatus] = useState('')
  const [denied, setDenied] = useState(false), [blocked, setBlocked] = useState(false), [pending, setPending] = useState(false), [attempt, setAttempt] = useState(0)
  const generation = useRef(0), lifecycle = useRef<AbortController | null>(null), busy = useRef(false)
  const base = `/api/music/library/${guildId}`
  const deny = useCallback(() => { setData(null); setDetail(null); setDetailError(''); setDenied(true); setBlocked(true); setError('No pude verificar el acceso a esta biblioteca. Vuelve a verificar tu sesión y los permisos del servidor.') }, [])
  useEffect(() => {
    const controller = new AbortController(), epoch = ++generation.current
    lifecycle.current = controller; busy.current = false; setPending(false); setLoading(true); setData(null); setDetail(null); setError(''); setDetailError(''); setDenied(false); setStatus('')
    request<unknown>(base, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) }).then(value => {
      if (controller.signal.aborted || epoch !== generation.current) return
      const parsed = parseLibrary(value, userId, guildId)
      if (!parsed) throw new Error('invalid_library')
      setData(parsed); setBlocked(false)
    }).catch(reason => {
      if (controller.signal.aborted || epoch !== generation.current) return
      if (reason instanceof ApiError && [401, 403].includes(reason.status)) deny()
      else { setBlocked(true); setError('No pude cargar la biblioteca. Tus canciones guardadas se conservan; vuelve a intentarlo.') }
    }).finally(() => { if (!controller.signal.aborted && epoch === generation.current) setLoading(false) })
    return () => { generation.current++; controller.abort(); lifecycle.current = null }
  }, [base, userId, guildId, attempt, deny])
  const availablePlaylist = !!playlistId && !!data?.playlists.some(item => item.id === playlistId && !item.automatic)
  useEffect(() => {
    setDetail(null); setDetailError(''); setDetailLoading(false)
    if (!playlistId) return
    if (!availablePlaylist) { if (!loading) setDetailError('Esta playlist ya no está disponible en tu biblioteca.'); return }
    const controller = new AbortController()
    setDetailLoading(true)
    request<unknown>(`${base}/playlists/${playlistId}`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) }).then(value => {
      if (controller.signal.aborted) return
      const parsed = parsePlaylist(value, userId, guildId, playlistId)
      if (!parsed) throw new Error('invalid_playlist')
      setDetail(parsed)
    }).catch(reason => {
      if (controller.signal.aborted) return
      if (reason instanceof ApiError && (reason.status === 401 || reason.status === 403 && reason.code !== 'forbidden')) deny()
      else setDetailError('No pude abrir esta playlist. Vuelve a cargar la biblioteca para comprobar su estado.')
    }).finally(() => { if (!controller.signal.aborted) setDetailLoading(false) })
    return () => controller.abort()
  }, [base, userId, guildId, playlistId, availablePlaylist, loading, attempt, deny])
  useEffect(() => {
    if (!pending) return
    const leave = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', leave)
    return () => window.removeEventListener('beforeunload', leave)
  }, [pending])
  async function action(kind: 'unlike' | 'play' | 'playLiked', track?: LibraryTrack) {
    if (busy.current || !data || blocked || denied || loading || kind !== 'playLiked' && !track) return
    const epoch = generation.current, active = lifecycle.current?.signal
    if (!active || active.aborted) return
    busy.current = true; setPending(true); setError(''); setStatus(kind === 'unlike' ? 'Quitando de Tus Me gusta…' : 'Confirmando el envío a música…')
    try {
      const signal = AbortSignal.any([active, AbortSignal.timeout(45000)])
      if (kind === 'unlike') {
        const result = await request<{ success?: boolean; data?: { liked?: boolean } }>('/api/music/like', { csrfToken, signal, body: { trackId: track!.key, ...(track!.uri ? { uri: track!.uri } : {}), liked: false } })
        if (epoch !== generation.current || active.aborted) return
        if (result.success !== true || result.data?.liked !== false) throw new Error('unknown_like_result')
        setData(current => current ? { ...current, liked: current.liked.filter(item => item.key !== track!.key) } : current)
        setStatus('Canción quitada de Tus Me gusta. La playlist automática se ha actualizado.')
      } else {
        const result = await request<{ ok?: boolean; success?: boolean; added?: number; data?: { added?: number } }>(kind === 'playLiked' ? `/api/music/liked/play/${guildId}` : `/api/player/${guildId}/add`, { csrfToken, signal, body: kind === 'playLiked' ? {} : { uri: track!.uri } })
        if (epoch !== generation.current || active.aborted) return
        const added = result.data?.added ?? result.added
        if (!(result.ok === true || result.success === true) || typeof added !== 'number' || !Number.isFinite(added) || added < 1) throw new Error('unknown_play_result')
        setStatus(`${added === 1 ? 'Canción añadida' : `${added} canciones añadidas`} a la música de este servidor.`)
      }
    } catch (reason) {
      if (epoch !== generation.current || active.aborted) return
      setStatus('')
      if (reason instanceof ApiError && ([401, 403].includes(reason.status) || reason.code === 'no_permission')) deny()
      else if (reason instanceof ApiError && reason.code === 'no_voice_channel') setError('Abre el reproductor y elige un canal de voz para empezar a escuchar.')
      else if (reason instanceof ApiError && reason.code === 'empty_collection') setError('No hay canciones disponibles para reproducir en Tus Me gusta.')
      else {
        setBlocked(true)
        setError(kind === 'unlike' ? 'No pude confirmar el cambio. Actualiza la biblioteca antes de repetir; quitar un corazón no lo vuelve a activar.' : 'No pude confirmar el envío. Comprueba la cola en el reproductor antes de actualizar la biblioteca y repetir la acción.')
      }
    } finally { if (epoch === generation.current && !active.aborted) { busy.current = false; setPending(false) } }
  }
  return { data, detail, loading, detailLoading, error, detailError, status, denied, blocked, pending,
    refresh: () => { if (!busy.current) setAttempt(value => value + 1) }, unlike: (track: LibraryTrack) => action('unlike', track), play: (track: LibraryTrack) => action('play', track), playLiked: () => action('playLiked') }
}
