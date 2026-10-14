const { test } = require('node:test')
const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const { createModuleRegistry } = require('../handlers/feature-registry')

test('logical capabilities normalize aliases and never grant a different module action', () => {
  const registry = createModuleRegistry(), manifest = require('../handlers/music/manifest')({})
  registry.register(manifest, {})
  assert.deepEqual(registry.resolveCapability('music', 'read'), registry.resolveCapability('music', 'music.view'))
  assert.equal(registry.resolveCapability('music', 'edit').id, 'music.configure')
  assert.equal(registry.resolveCapability('music', 'manage').policy, 'ManageGuild')
  assert.equal(registry.resolveCapability('music', 'tickets.configure'), null)
  assert.equal(registry.resolveCapability('music', 'ban'), null)
  assert.equal(registry.resolveCapability('tickets', 'configure'), null)
})

test('welcome registers its shared configuration without adding duplicate delivery handlers', () => {
  const client = new EventEmitter()
  client.settings = require('./helpers/configuration-settings').moduleSettingsFixture().store
  const initialize = require('../handlers/configuration')
  const first = initialize(client)
  assert.equal(initialize(client), first)
  assert.equal(client.modules.get('welcome').service, client.moduleConfiguration)
  assert.equal(client.modules.list().length, 1)
  assert.equal(client.listenerCount('guildMemberAdd'), 0)
  assert.equal(client.modules.resolveCapability('welcome', 'configure').policy, 'ManageGuild')
  assert.equal(client.modules.get('welcome').manifest.capabilities.cards, 'pending')
})

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
  const nodes = loaded.allCommands.find(command => command.name === 'nodes')
  assert.equal(nodes.default_member_permissions, '32')
  assert.equal(nodes.dm_permission, false)
  assert.equal(loaded.allCommands.some(command => command.name === 'nsfw' || command.nsfw === true), false)
})
