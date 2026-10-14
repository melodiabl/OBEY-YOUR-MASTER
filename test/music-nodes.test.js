const test = require('node:test')
const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const privateNode = { id: 'private-primary', label: 'Internal', host: '127.0.0.1', port: 2333, password: 'private-secret', secure: false, visibility: 'private', priority: 0 }
const publicNode = { id: 'public-one', label: 'Public One', host: 'music.example.com', port: 443, password: 'public-password', secure: true, visibility: 'public', priority: 10 }
const secondNode = { ...publicNode, id: 'public-two', label: 'Public Two', host: 'other.example.com', priority: 20 }
const config = () => require('../handlers/music/nodes-config')
function fixture() {
  const entries = config().validateNodes([privateNode, publicNode, secondNode])
  const nodes = new Map(entries.map(entry => [entry.id, { name: entry.id, state: 1, penalties: 0, stats: { players: 0 } }]))
  const manager = new EventEmitter(); manager.nodes = nodes; manager.players = new Map()
  const preference = new Map()
  const pool = require('../handlers/music/nodes').createNodePool(entries, { preferenceFor: guildId => preference.get(guildId) || 'auto', now: () => 1000 })
  pool.attach(manager)
  return { pool, manager, nodes, preference }
}
test('private environment credentials stay on the private node, alongside explicit public credentials', () => {
  const entries = config().loadNodeConfig({ env: { LAVALINK_HOST: '127.0.0.1', LAVALINK_PASSWORD: 'private-secret', LAVALINK_NODES_FILE: '/configured.json' }, legacyNodes: [], readFile: () => JSON.stringify({ version: 1, nodes: [publicNode] }) })
  assert.equal(entries.length, 2)
  assert.equal(entries.find(entry => entry.visibility === 'private').auth, 'private-secret')
  assert.equal(entries.find(entry => entry.visibility === 'public').auth, 'public-password')
  assert.throws(() => config().validateNodes([{ ...publicNode, password: '' }]), /credential/i)
})
test('node configuration rejects duplicate IDs, plaintext public transport and URLs in host fields', () => {
  for (const value of [
    [publicNode, publicNode], [{ ...publicNode, secure: false }], [{ ...publicNode, host: 'https://user:password@host/path' }],
    [{ ...publicNode, port: 0 }], [{ ...publicNode, id: 'private-primary' }],
  ]) assert.throws(() => config().validateNodes(value))
  assert.throws(() => config().validateNodes(Array.from({ length: 21 }, (_, i) => ({ ...publicNode, id: 'public-' + i }))))
})
test('legacy unclassified nodes remain private and public descriptors cannot leak addresses or credentials', () => {
  const entries = config().loadNodeConfig({ env: {}, legacyNodes: [{ identifier: 'Original', host: '127.0.0.1', port: 2333, password: 'private-secret', secure: false }] })
  assert.equal(entries[0].visibility, 'private')
  const { pool } = fixture()
  const serialized = JSON.stringify(pool.view('guild'))
  for (const secret of ['private-secret', '127.0.0.1', 'private-primary', 'public-password', 'music.example.com']) assert.ok(!serialized.includes(secret))
  assert.equal(pool.view('guild').nodes.length, 2)
})
test('automatic mode prefers the internal node; disconnected nodes fall back to eligible public nodes', () => {
  const { pool, nodes } = fixture()
  assert.equal(pool.choose('guild').name, 'private-primary')
  nodes.get('private-primary').state = 0
  assert.equal(pool.choose('guild').name, 'public-one')
  nodes.get('public-one').state = 0
  assert.equal(pool.choose('guild').name, 'public-two')
})
test('public preferences and temporary search pins are isolated by guild', () => {
  const { pool, preference } = fixture()
  preference.set('guild-a', 'public-two')
  assert.equal(pool.choose('guild-a').name, 'public-two')
  assert.equal(pool.choose('guild-b').name, 'private-primary')
  pool.pin('guild-b', 'public-one')
  assert.equal(pool.choose('guild-b').name, 'public-one')
  assert.equal(pool.choose('guild-a').name, 'public-two')
  pool.unpin('guild-b')
  assert.equal(pool.choose('guild-b').name, 'private-primary')
})
test('private, invented and offline selections are rejected before changing a session', () => {
  const { pool, nodes } = fixture()
  for (const id of ['private-primary', 'invented', 'https://attacker.example']) assert.throws(() => pool.validateSelection(id), /not_available/)
  nodes.get('public-one').state = 0
  assert.throws(() => pool.validateSelection('public-one'), /unavailable/)
  assert.equal(pool.validateSelection('auto'), 'auto')
})
test('failed nodes are excluded for a bounded cooldown without changing other guild preferences', () => {
  const { pool } = fixture()
  pool.fail('private-primary')
  assert.equal(pool.choose('guild').name, 'public-one')
  assert.ok(pool.candidates('guild').every(node => node.name !== 'private-primary'))
  pool.recover('private-primary')
  assert.equal(pool.choose('guild').name, 'private-primary')
})
test('public-node plugins cannot turn the music resolver into an adult content provider', () => {
  const { allowedMusicTrack, assertMusicQuery } = config()
  for (const sourceName of ['pornhub', 'soundgasm']) assert.equal(allowedMusicTrack({ info: { sourceName, uri: 'https://example.com' } }), false)
  for (const sourceName of ['flowery-tts', 'reddit', 'tiktok', 'speak']) assert.equal(allowedMusicTrack({ info: { sourceName } }), false)
  assert.equal(allowedMusicTrack({ info: { sourceName: 'spotify', explicit: true } }), false)
  assert.equal(allowedMusicTrack({ info: { sourceName: 'youtube', uri: 'https://www.pornhub.com/x' } }), false)
  assert.throws(() => assertMusicQuery('https://www.pornhub.com/view_video.php?id=x'), /source_not_allowed/)
  assert.equal(allowedMusicTrack({ info: { sourceName: 'youtube', uri: 'https://www.youtube.com/watch?v=x' } }), true)
  assert.equal(assertMusicQuery('A song title'), 'A song title')
})
