const test = require('node:test'), assert = require('node:assert/strict'), http = require('node:http')
const { REST } = require('discord.js')
const discordRestOptions = require('../handlers/project/discord-rest')

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
