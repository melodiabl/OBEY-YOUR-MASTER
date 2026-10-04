const { test } = require('node:test')
const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const { createModuleRegistry } = require('../handlers/module-registry')

test('registry rejects duplicate identities and incomplete contracts', () => {
  const registry = createModuleRegistry()
  assert.throws(() => registry.register({ id: 'music' }), /manifest/i)
  const manifest = require('../handlers/music/manifest')({})
  registry.register(manifest, {})
  assert.throws(() => registry.register(manifest, {}), /duplicate/i)
})

test('music registers the actual service without replacing its session or queue', () => {
  const client = new EventEmitter()
  client.shoukaku = { players: new Map(), nodes: new Map(), options: { nodeResolver: () => null } }
  client.channels = { cache: new Map() }
  require('../handlers/musichandler')(client)
  const module = client.modules.get('music')
  assert.equal(module.service, client.music)
  const state = module.service.getState('manifest-guild')
  assert.equal(state, client.music.getState('manifest-guild'))
  assert.equal(module.manifest.interactions.length, 12)
  assert.equal(module.manifest.capabilities.guildToggle, 'pending')
  assert.equal(module.manifest.capabilities.lyricsRealtime, 'pending')
  assert.ok(Object.isFrozen(module.manifest.defaults))
})

test('missing engine is unavailable and command inventory preserves the loaders', () => {
  const client = new EventEmitter()
  require('../handlers/musichandler')(client)
  assert.equal(client.modules.get('music').manifest.capabilities.playback, 'unavailable')
  assert.equal(client.modules.get('music').service, undefined)
  const { Collection } = require('discord.js')
  const loaded = { slashCommands: new Collection() }
  require('../handlers/slashCommands')(loaded)
  const manifest = require('../handlers/music/manifest')(loaded)
  const music = loaded.allCommands.find(command => command.name === 'music')
  assert.deepEqual(manifest.commands.slash, music.options.map(option => `music.${option.name}`))
  assert.equal(music.options.length, 25)
  assert.equal(loaded.allCommands.length, 19)
})
