const test = require('node:test'), assert = require('node:assert/strict')
const { createPlaybackHealth } = require('../handlers/music/playback-health')
test('voice health records actual player telemetry without track or credentials', () => {
  const rows = [], player = { node: { name: 'public-one', auth: 'secret', stats: { cpu: { lavalinkLoad: .1 }, frameStats: { sent: 1000, deficit: 5, nulled: 1 } } } }
  const observe = createPlaybackHealth('private-guild-id', player, { write: (level, row) => rows.push({ level, row }) })
  observe({ state: { position: 10000, connected: true, ping: 32 }, track: { encoded: 'private-track' } })
  assert.equal(rows[0].row.voicePingMs, 32); assert.equal(rows[0].row.connected, true); assert.equal(rows[0].row.node, 'public-one')
  assert.equal(rows[0].row.nodeFrames.deficit, 5); assert.equal(rows[0].row.nodeCpuPercent, 10)
  assert.doesNotMatch(JSON.stringify(rows), /secret|private-guild-id|private-track/)
})
test('health logs are throttled but disconnect and recovery are recorded immediately', () => {
  let at = 0; const rows = [], observe = createPlaybackHealth('g', { node: { name: 'one' } }, { now: () => at, write: (level, row) => rows.push({ level, row }) })
  const event = { state: { connected: true, ping: 25, position: 10 } }
  observe(event); observe(event); assert.equal(rows.length, 1)
  at = 1000; observe({ state: { connected: false, ping: -1, position: 10 } }); assert.equal(rows[1].level, 'warn'); assert.equal(rows[1].row.voicePingMs, null)
  observe(event); assert.equal(rows.length, 3)
  at = 32000; observe(event); assert.equal(rows.length, 4)
})
test('missing telemetry is never reported as zero packet loss or zero ping', () => {
  const rows = [], observe = createPlaybackHealth('g', { node: { name: 'one' } }, { write: (_, row) => rows.push(row) })
  observe({ state: { position: 10 } }); assert.equal(rows.length, 0)
  observe({ state: { connected: true, ping: -1, position: 10 } })
  assert.equal(rows[0].voicePingMs, null); assert.equal(rows[0].nodeFrames, null); assert.equal(rows[0].nodeCpuPercent, null)
})
test('the active player update records voice health without accepting an obsolete player', t => {
  t.mock.timers.enable({ apis: ['Date'], now: 100000 })
  const { EventEmitter } = require('node:events'), { playerStates } = require('../handlers/music/state')
  const bind = require('../handlers/music/player-events'), guildId = 'health-integration', rows = []
  const player = Object.assign(new EventEmitter(), { node: { name: 'one' } })
  const client = { shoukaku: { players: new Map([[guildId, player]]) } }
  const original = console.info
  console.info = (label, json) => { if (label === '[Music] Playback health:') rows.push(JSON.parse(json)) }
  playerStates.set(guildId, { currentTrack: { encoded: 'track' }, status: 'playing', lastPosition: 0 })
  try {
    bind(client, player, guildId, { emitState() {}, elapsedForState: () => 1000 })
    player.emit('update', { state: { position: 1000, connected: true, ping: 34, time: Date.now() } })
    assert.equal(rows.length, 1); assert.equal(rows[0].voicePingMs, 34)
    assert.equal(playerStates.get(guildId).lastPosition, 1000)
    client.shoukaku.players.set(guildId, {})
    player.emit('update', { state: { position: 2000, connected: false, ping: -1 } })
    assert.equal(rows.length, 1); assert.equal(playerStates.get(guildId).lastPosition, 1000)
  } finally { console.info = original; playerStates.delete(guildId); player.removeAllListeners() }
})
