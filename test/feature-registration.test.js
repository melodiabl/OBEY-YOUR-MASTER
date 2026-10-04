const { EventEmitter } = require('node:events')
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { registerFeature } = require('../handlers/feature-registration')

test('legacy features initialize after preload and ignore early guild events', async () => {
  const client = new EventEmitter()
  let started = 0, messages = 0
  registerFeature(client, 'fixture', client => {
    client.once('ready', () => started++)
    client.on('messageCreate', async () => messages++)
  })
  client.emit('ready')
  client.emit('messageCreate')
  assert.equal(started, 0)
  assert.equal(messages, 0)
  client._dbReady = true
  client.emit('dbReady')
  client.emit('messageCreate')
  await Promise.resolve()
  assert.equal(started, 1)
  assert.equal(messages, 1)
  client._shuttingDown = true
  client.emit('messageCreate')
  assert.equal(messages, 1)
})
