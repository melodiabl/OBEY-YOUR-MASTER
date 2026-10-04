const { canManageGuild } = require('../handlers/permissions')

// Reload from the session store for every delivery. Permission snapshots live only
// on this socket (never in the session store) and expire within 15 seconds.
function createSocketAuthorizer(fetchGuilds, { now = Date.now, ttl = 15000 } = {}) {
  const permissions = new WeakMap()
  return async (socket, guildId) => {
    const req = socket.request
    try {
      await new Promise((resolve, reject) => req.session.reload(error => error ? reject(error) : resolve()))
    } catch { throw new Error('not_authenticated') }
    // reload replaces req.session: do not keep the pre-reload reference.
    const user = req.session?.user
    if (!user?.id || !Number.isFinite(user.expires_at) || user.expires_at <= now()) throw new Error('not_authenticated')
    if (guildId === undefined) return
    let snapshot = permissions.get(socket)
    if (!snapshot || snapshot.userId !== user.id || snapshot.token !== user.access_token || now() >= snapshot.expiresAt) {
      try {
        const fetchedAt = now()
        const guilds = await fetchGuilds(user.access_token)
        if (!Array.isArray(guilds)) throw new Error('invalid_guilds')
        snapshot = { userId: user.id, token: user.access_token, guilds, expiresAt: fetchedAt + ttl }
        await new Promise((resolve, reject) => req.session.reload(error => error ? reject(new Error('not_authenticated')) : resolve()))
        const current = req.session?.user
        if (current?.id !== user.id || current?.access_token !== user.access_token || !Number.isFinite(current?.expires_at) || current.expires_at <= now()) throw new Error('not_authenticated')
        permissions.set(socket, snapshot)
      } catch (error) { permissions.delete(socket); throw new Error(error.message === 'not_authenticated' ? 'not_authenticated' : 'permissions_unavailable') }
    }
    if (!canManageGuild({ guilds: snapshot.guilds }, guildId)) throw new Error('no_permission')
  }
}

function createMusicRealtime(io, client, authorize) {
  const connections = new Map()
  const room = guildId => `guild:${guildId}:music`
  function remove(socket, data, guildId) {
    data.subscriptions.delete(guildId)
    for (const [key, entry] of data.pending) if (entry.guildId === guildId) data.pending.delete(key)
    socket.leave(room(guildId))
  }
  function enqueue(socket, data, guildId, event, payload) {
    const token = data.subscriptions.get(guildId)
    if (!token || !socket.connected) return Promise.resolve()
    const key = `${guildId}:${event}`
    const existing = data.pending.get(key)
    if (existing) existing.payload = payload
    else data.pending.set(key, { guildId, event, payload, token })
    if (data.running) return data.running
    data.running = (async () => {
      while (data.pending.size && socket.connected) {
        const [key, entry] = data.pending.entries().next().value
        try {
          await authorize(socket, entry.guildId)
          if (!socket.connected || data.subscriptions.get(entry.guildId) !== entry.token) continue
          // Validate again after awaits: a guild may have been removed meanwhile.
          if (!client.guilds.cache.has(entry.guildId)) throw new Error('no_permission')
          await socket.join(room(entry.guildId))
          if (!socket.connected || data.subscriptions.get(entry.guildId) !== entry.token) {
            socket.leave(room(entry.guildId)); continue
          }
          const payload = entry.payload()
          if (payload != null) socket.emit(entry.event, payload)
        } catch (error) {
          remove(socket, data, entry.guildId)
          const code = ['not_authenticated', 'no_permission', 'permissions_unavailable'].includes(error.message)
            ? error.message : 'permissions_unavailable'
          socket.emit('player:error', { error: code })
          if (code === 'not_authenticated') socket.disconnect(true)
        } finally {
          if (data.pending.get(key) === entry) data.pending.delete(key)
        }
      }
    })().finally(() => { data.running = null })
    return data.running
  }
  io.on('connection', socket => {
    const data = { subscriptions: new Map(), pending: new Map(), running: null }
    connections.set(socket, data)
    socket.on('join', guildId => {
      if (typeof guildId !== 'string' || !client.guilds.cache.has(guildId) || data.subscriptions.size >= 20) {
        socket.emit('player:error', { error: 'no_permission' }); return
      }
      remove(socket, data, guildId)
      data.subscriptions.set(guildId, Symbol(guildId))
      // Reconnecting tabs get a current snapshot from the existing music service.
      enqueue(socket, data, guildId, 'player:state', () => client.music?.getPublicState?.(guildId) || { guildId, active: false })
    })
    socket.on('leave', guildId => { if (typeof guildId === 'string') remove(socket, data, guildId) })
    socket.on('disconnect', () => { data.subscriptions.clear(); data.pending.clear(); connections.delete(socket) })
  })
  return {
    publish(guildId, event, payload) {
      return Promise.all([...connections].map(([socket, data]) => enqueue(socket, data, guildId, event, payload)))
    },
    disconnectSession(sessionId) {
      for (const socket of connections.keys()) if (socket.request.sessionID === sessionId) socket.disconnect(true)
    },
  }
}

module.exports = { createMusicRealtime, createSocketAuthorizer }
