'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { ApiError, request } from './api'
import { isNewer, parsePlayer, type PlayerState } from './player-state'
export type Connection = 'loading' | 'ready' | 'live' | 'offline' | 'denied'
export function useMusic(guildId: string, csrfToken: string) {
  const [state, setState] = useState<PlayerState | null>(null)
  const [connection, setConnection] = useState<Connection>('loading')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const generation = useRef(0), latest = useRef<PlayerState | null>(null), busy = useRef(false)
  const accessDenied = useRef(false)
  const receive = useRef<(value: unknown, live?: boolean) => void>(() => {})
  useEffect(() => {
    const epoch = ++generation.current, controller = new AbortController()
    let disconnected = false
    latest.current = null; busy.current = false; accessDenied.current = false; setPending(false); setState(null); setConnection('loading'); setError('')
    const active = () => generation.current === epoch
    receive.current = (value, live = false) => {
      if (!active() || accessDenied.current || disconnected) return
      const parsed = parsePlayer(value, guildId)
      if (!parsed || !isNewer(latest.current, parsed)) return
      latest.current = parsed; setState(parsed); setError(''); setConnection(current => live || current === 'live' ? 'live' : 'ready')
    }
    const deny = (message: string) => { if (active()) { accessDenied.current = true; latest.current = null; setState(null); setConnection('denied'); setError(message) } }
    request<unknown>(`/api/player/${guildId}`, { signal: controller.signal })
      .then(value => { if (active()) receive.current(value) }).catch(reason => {
        if (!active() || controller.signal.aborted) return
        if (reason instanceof ApiError && [401, 403].includes(reason.status)) deny('No pude verificar el acceso a este servidor. Vuelve a comprobar tus permisos.')
        else if (!latest.current) { setConnection('offline'); setError('No pude cargar el reproductor. Vuelve a conectar.') }
      })
    const socket = io({ autoConnect: false, withCredentials: true })
    socket.on('connect', () => { if (active() && !accessDenied.current) { disconnected = false; socket.emit('join', guildId) } })
    const update = (value: unknown) => { if (active()) receive.current(value, true) }
    socket.on('player:state', update); socket.on('player:tick', update)
    socket.on('player:error', () => deny('El acceso ya no está disponible. Vuelve a comprobar tus permisos.'))
    const offline = () => {
      if (active() && !accessDenied.current) {
        disconnected = true
        latest.current = null; setState(null); setConnection('offline'); setError('No pude conectar con el servidor. Puedes volver a intentarlo.')
      }
    }
    socket.on('connect_error', offline)
    socket.on('disconnect', offline)
    socket.connect()
    return () => { generation.current++; controller.abort(); socket.emit('leave', guildId); socket.removeAllListeners(); socket.disconnect() }
  }, [guildId, attempt])
  const action = useCallback(async (name: string, value?: number) => {
    if (busy.current || accessDenied.current || !['ready', 'live'].includes(connection)) return
    const epoch = generation.current
    busy.current = true; setPending(true); setError('')
    try {
      const result = await request<{ state?: unknown }>(`/api/player/${guildId}/action`, {
        csrfToken, body: { action: name, value }, signal: AbortSignal.timeout(15000),
      })
      if (generation.current === epoch && result.state) receive.current(result.state)
    } catch (reason) {
      if (generation.current !== epoch) return
      if (reason instanceof ApiError && ([401, 403].includes(reason.status) || reason.code === 'no_permission')) {
        accessDenied.current = true; latest.current = null; setState(null); setConnection('denied'); setError('Tus permisos cambiaron. Vuelve a verificar el acceso.')
      } else setError('No pude confirmar el cambio. Revisa el estado antes de repetir la acción.')
    } finally { if (generation.current === epoch) { busy.current = false; setPending(false) } }
  }, [guildId, csrfToken, connection])
  return { state, connection, error, pending, action, reconnect: () => setAttempt(value => value + 1) }
}
export function useElapsed(state: PlayerState | null) {
  const base = state?.current?.elapsed || 0
  const [tick, setTick] = useState<{ state: PlayerState | null; value: number }>({ state: null, value: 0 })
  useEffect(() => {
    if (!state?.clockRunning || state.paused || !state.active) return
    const started = performance.now()
    const timer = setInterval(() => setTick({ state, value: Math.min(state.current?.length || Infinity, base + (performance.now() - started) * state.playbackRate) }), 1000)
    return () => clearInterval(timer)
  }, [state, base])
  return tick.state === state && state?.clockRunning && !state.paused ? tick.value : base
}
