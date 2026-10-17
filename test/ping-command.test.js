const test = require('node:test'), assert = require('node:assert/strict')
function fixture() {
  const edits = [], acknowledgements = []
  const client = { user: { username: 'OBEY', displayAvatarURL: () => 'https://example.test/avatar.png' }, ws: { ping: 124 },
    settings: { get: (_, key) => key === 'language' ? 'es' : { color: 0xFFD36F } }, getFooter: () => ({ text: 'OBEY' }),
    shoukaku: { players: new Map([['g', { ping: 337 }]]) }, music: { getNodes: () => ({ currentId: 'public', nodes: [{ id: 'public', label: 'Public' }] }) },
    la: { es: { cmds: { info: { ping: { m1: 'Cargando', m2: '{botping} / {ping} / {wsping}' } } } } } }
  const context = { guildId: 'g', guild: { id: 'g' }, member: { guild: { id: 'g' } }, createdTimestamp: Date.now(),
    reply: async payload => { acknowledgements.push(payload); return { edit: async payload => edits.push(payload) } },
    deferReply: async payload => acknowledgements.push(payload), editReply: async payload => edits.push(payload) }
  return { client, context, edits, acknowledgements }
}
test('prefix ping separates acknowledgement, Discord and music latency', async () => {
  const f = fixture(); await require('../commands/Info/ping').run(f.client, f.context)
  assert.equal(f.edits.length, 1)
  const result = f.edits[0].embeds[0].toJSON()
  assert.match(JSON.stringify(result.fields), /124 ms/); assert.match(JSON.stringify(result.fields), /337 ms/)
  assert.match(JSON.stringify(result.fields), /Confirmación|Respuesta/)
})
test('slash ping never spawns a synchronous process or invents a localhost ping', async () => {
  const f = fixture(), cp = require('node:child_process'), original = cp.spawnSync
  let spawned = 0; cp.spawnSync = () => { spawned++; throw Error('no system command allowed') }
  try { await require('../slashCommands/Info/ping').run(f.client, f.context, null, { color: 0xFFD36F }, 'es') }
  finally { cp.spawnSync = original }
  assert.equal(spawned, 0); assert.equal(f.edits.length, 1); assert.equal(f.acknowledgements[0].ephemeral, true)
})
test('acknowledgement measurement uses elapsed milliseconds without adding other pings', async () => {
  const f = fixture(); let time = 100
  f.context.deferReply = async () => { time = 187 }
  await require('../handlers/project/ping').runPing(f.client, f.context, { slash: true, now: () => time, locale: 'es' })
  const fields = f.edits[0].embeds[0].toJSON().fields
  assert.equal(fields.find(field => /Confirmación|Respuesta/.test(field.name)).value, '87 ms')
})
test('unavailable ping values and no voice connection are shown honestly', async () => {
  const f = fixture(); f.client.ws.ping = -1; f.client.shoukaku.players.clear()
  await require('../handlers/project/ping').runPing(f.client, f.context, { locale: 'en' })
  const result = JSON.stringify(f.edits[0].embeds[0].toJSON())
  assert.match(result, /Unavailable/); assert.doesNotMatch(result, /-1 ms|337 ms|NaN|undefined/)
})
