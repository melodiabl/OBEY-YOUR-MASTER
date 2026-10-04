const { test } = require('node:test')
const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const { createMusicRealtime, createSocketAuthorizer } = require('../dashboard/music-realtime')

function fixture(authorize = async () => {}) {
  const io = new EventEmitter()
  const socket = new EventEmitter()
  socket.connected = true
  socket.request = { sessionID: 'session' }
  socket.rooms = new Set()
  socket.join = room => socket.rooms.add(room)
  socket.leave = room => socket.rooms.delete(room)
  socket.disconnect = () => { socket.connected = false; socket.emit('disconnect') }
  const sent = []
  for (const event of ['player:state', 'player:tick', 'player:error']) socket.on(event, data => sent.push([event, data]))
  let revision = 1
  const client = { guilds: { cache: new Map([['g', {}], ['other', {}]]) }, music: { getPublicState: guildId => ({ guildId, revision }) } }
  const realtime = createMusicRealtime(io, client, authorize)
  io.emit('connection', socket)
  return { realtime, socket, sent, setRevision: value => { revision = value } }
}
const settle = () => new Promise(resolve => setImmediate(resolve))

test('only installed string guild IDs can subscribe; room and snapshot are scoped to music', async () => {
  const f = fixture()
  f.socket.emit('join', { id: 'g' }); f.socket.emit('join', 'missing')
  await settle()
  assert.equal(f.sent.filter(([event]) => event === 'player:state').length, 0)
  f.socket.emit('join', 'g'); await settle()
  assert.deepEqual([...f.socket.rooms], ['guild:g:music'])
  assert.deepEqual(f.sent.at(-1), ['player:state', { guildId: 'g', revision: 1 }])
  f.setRevision(2)
  await f.realtime.publish('g', 'player:state', () => ({ guildId: 'g', revision: 2 }))
  assert.equal(f.sent.at(-1)[1].revision, 2)
})

test('permission loss revokes subscriptions before delivering any more state', async () => {
  let denied = false
  const f = fixture(async () => { if (denied) throw new Error('no_permission') })
  f.socket.emit('join', 'g'); await settle()
  denied = true
  await f.realtime.publish('g', 'player:tick', () => ({ elapsed: 10 }))
  assert.equal(f.sent.some(([event]) => event === 'player:tick'), false)
  assert.equal(f.socket.rooms.size, 0)
  assert.deepEqual(f.sent.at(-1), ['player:error', { error: 'no_permission' }])
})

test('leave and logout invalidate a subscription still awaiting authorization', async () => {
  let release
  const f = fixture(() => new Promise(resolve => { release = resolve }))
  f.socket.emit('join', 'g'); await settle()
  f.socket.emit('leave', 'g'); release(); await settle()
  assert.equal(f.socket.rooms.size, 0)
  assert.equal(f.sent.length, 0)
  f.socket.emit('join', 'g'); await settle()
  f.realtime.disconnectSession('session'); release(); await settle()
  assert.equal(f.socket.connected, false)
  assert.equal(f.sent.length, 0)
})

test('pending sends are coalesced and retrieve the latest payload after validation', async () => {
  let release
  let delayed = false
  const f = fixture(() => delayed ? new Promise(resolve => { release = resolve }) : Promise.resolve())
  f.socket.emit('join', 'g'); await settle()
  delayed = true
  const first = f.realtime.publish('g', 'player:state', () => ({ revision: 2 }))
  await settle()
  const second = f.realtime.publish('g', 'player:state', () => ({ revision: 3 }))
  release(); await Promise.all([first, second])
  assert.equal(f.sent.at(-1)[1].revision, 3)
  assert.equal(f.sent.filter(([event]) => event === 'player:state').length, 2)
})

test('socket authorizer reloads the session and bounds cached Discord permissions', async () => {
  let now = 1000, fetches = 0, guilds = [{ id: 'g', permissions: '32' }]
  const socket = { request: { session: { reload(cb) { cb() }, user: { id: 'u', access_token: 'token', expires_at: 100000 } } } }
  const authorize = createSocketAuthorizer(async () => { fetches++; return guilds }, { now: () => now, ttl: 15000 })
  await authorize(socket, 'g'); await authorize(socket, 'g')
  assert.equal(fetches, 1)
  guilds = []; now += 15001
  await assert.rejects(authorize(socket, 'g'), /no_permission/)
  delete socket.request.session.user
  await assert.rejects(authorize(socket, 'g'), /not_authenticated/)
})

test('missing stored sessions, expired tokens and provider failures fail closed', async () => {
  const authorize = createSocketAuthorizer(async () => { throw new Error('provider secret') })
  const socket = { request: { session: { reload(cb) { cb(new Error('missing')) } } } }
  await assert.rejects(authorize(socket), /not_authenticated/)
  socket.request.session = { reload(cb) { cb() }, user: { id: 'u', expires_at: 1 } }
  await assert.rejects(authorize(socket), /not_authenticated/)
  socket.request.session.user.expires_at = Date.now() + 100000
  await assert.rejects(authorize(socket, 'g'), /permissions_unavailable/)
})

test('real Socket.IO tabs reconnect to current state and stop receiving after session deletion', async t => {
  const express = require('express')
  const session = require('express-session')
  const http = require('node:http')
  const { Server } = require('socket.io')
  const { io: connect } = require('socket.io-client')
  const { once } = require('node:events')
  const store = new session.MemoryStore()
  const middleware = session({ secret: 'isolated-test-only-secret', store, resave: false, saveUninitialized: false })
  const app = express()
  app.use(middleware)
  let sessionId
  app.get('/fixture-login', (req, res) => {
    sessionId = req.sessionID
    req.session.user = { id: 'fixture-user', access_token: 'fixture-token', expires_at: Date.now() + 100000 }
    res.send('fixture')
  })
  const server = http.createServer(app)
  const io = new Server(server)
  io.engine.use(middleware)
  const authorize = createSocketAuthorizer(async () => [{ id: 'g', permissions: '32' }])
  io.use((socket, next) => authorize(socket).then(() => next(), () => next(new Error('Unauthorized'))))
  let revision = 1
  const realtime = createMusicRealtime(io, { guilds: { cache: new Map([['g', {}]]) }, music: { getPublicState: () => ({ guildId: 'g', revision }) } }, authorize)
  const tabs = []
  t.after(async () => { for (const tab of tabs) tab.close(); await new Promise(resolve => io.close(resolve)) })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const url = `http://127.0.0.1:${server.address().port}`
  const response = await fetch(`${url}/fixture-login`)
  const cookie = response.headers.get('set-cookie').split(';')[0]
  const open = async authenticated => {
    const tab = connect(url, { extraHeaders: authenticated ? { Cookie: cookie } : {}, transports: ['websocket'], reconnection: false, autoConnect: false })
    tabs.push(tab)
    const ready = once(tab, authenticated ? 'connect' : 'connect_error', { signal: AbortSignal.timeout(3000) })
    tab.connect(); await ready
    return tab
  }
  const denied = await open(false)
  assert.equal(denied.connected, false)
  const first = await open(true), second = await open(true)
  for (const tab of [first, second]) {
    const snapshot = once(tab, 'player:state', { signal: AbortSignal.timeout(3000) })
    tab.emit('join', 'g')
    assert.equal((await snapshot)[0].revision, 1)
  }
  first.close(); revision = 8
  const reconnected = await open(true)
  const snapshot = once(reconnected, 'player:state', { signal: AbortSignal.timeout(3000) })
  reconnected.emit('join', 'g')
  assert.equal((await snapshot)[0].revision, 8)
  await new Promise((resolve, reject) => store.destroy(sessionId, error => error ? reject(error) : resolve()))
  const stopped = [second, reconnected].map(tab => once(tab, 'disconnect', { signal: AbortSignal.timeout(3000) }))
  let leaked = false
  for (const tab of [second, reconnected]) tab.on('player:tick', () => { leaked = true })
  await realtime.publish('g', 'player:tick', () => ({ elapsed: 100 }))
  await Promise.all(stopped)
  assert.equal(leaked, false)
})
