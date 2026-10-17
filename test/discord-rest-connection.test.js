const test = require('node:test'), assert = require('node:assert/strict'), http = require('node:http')
const { REST } = require('discord.js')
const { discordRestOptions, observeRateLimits } = require('../handlers/project/discord-rest')

test('Discord REST reuses its connection across sequential message operations', async () => {
  let connections = 0, requests = 0
  const server = http.createServer((req, res) => { requests++; res.setHeader('Content-Type', 'application/json'); res.end('{"ok":true}') })
  server.on('connection', () => { connections++ })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const options = discordRestOptions(), rest = new REST({ ...options, api: 'http://127.0.0.1:' + server.address().port })
  try {
    for (let i = 0; i < 4; i++) {
      assert.deepEqual(await rest.get('/gateway', { auth: false }), { ok: true })
      // Separate event-loop turns, as with distinct controls; release the completed socket.
      await new Promise(resolve => setImmediate(resolve))
    }
    assert.equal(requests, 4); assert.equal(connections, 1)
  } finally {
    rest.clearHashSweeper(); rest.clearHandlerSweeper(); await options.agent.close()
    await new Promise(resolve => server.close(resolve))
  }
})
test('HTTP timing preserves response and abort options without logging URL or credentials', async () => {
  let at = 0; const rows = [], response = { status: 200 }, signal = new AbortController().signal
  const options = discordRestOptions({ now: () => at, write: row => rows.push(row), makeRequest: async (url, request) => {
    assert.equal(request.signal, signal); at = 5500; return response
  } })
  try {
    assert.equal(await options.makeRequest('https://discord.com/api/v10/channels/123456/messages/789012?secret=token', { method: 'PATCH', signal, headers: { Authorization: 'private-token' } }), response)
    assert.equal(rows[0].durationMs, 5500); assert.equal(rows[0].statusCode, 200)
    assert.doesNotMatch(JSON.stringify(rows), /123456|789012|private-token|secret|https/)
  } finally { await options.agent.close() }
})
test('rate-limit telemetry is bounded and distinguishes queue waits from HTTP requests', () => {
  const { EventEmitter } = require('node:events'), rest = new EventEmitter(), rows = []
  let at = 0
  const dispose = observeRateLimits(rest, { now: () => at, write: row => rows.push(row) })
  const event = { method: 'PATCH', route: '/channels/:id/messages/:id', majorParameter: 'private-channel', timeToReset: 5500, limit: 5, url: 'secret-token' }
  rest.emit('rateLimited', event); rest.emit('rateLimited', event)
  at = 11000; rest.emit('rateLimited', { ...event, global: true })
  assert.equal(rows.length, 2); assert.equal(rows[0].waitMs, 5500); assert.equal(rows[0].entryPoint, 'message_patch'); assert.equal(rows[1].entryPoint, 'global_rest')
  assert.doesNotMatch(JSON.stringify(rows), /private-channel|secret-token|\/channels/)
  dispose(); assert.equal(rest.listenerCount('rateLimited'), 0)
})
