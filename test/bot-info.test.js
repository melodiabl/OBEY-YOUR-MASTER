const test = require('node:test'), assert = require('node:assert/strict')
const { Collection } = require('discord.js')
function fixture() {
  const replies = [], edits = []
  const guild = { id: 'guild', memberCount: 20, members: { me: { voice: { channelId: 'voice' } } } }
  const client = { user: { id: '1460818547193417931', username: 'OBEY', displayAvatarURL: () => 'https://example.test/avatar.png' }, uptime: 123000,
    ws: { ping: 45 }, guilds: { cache: new Collection([['guild', guild], ['missing', { id: 'missing', memberCount: 3, members: { me: null } }]]) },
    users: { cache: new Collection([['cached', {}]]) }, settings: { get: (_, key) => key === 'language' ? 'es' : { color: 0xFFD36F } },
    shoukaku: { players: new Map([['guild', { ping: 32 }]]) }, music: { getNodes: () => ({ currentId: 'public-one', nodes: [{ id: 'public-one', label: 'Public One' }] }) },
    getFooter: () => ({ text: 'OBEY' }), la: { es: { cmds: { info: { botinfo: { loading: 'Cargando…' } } } } } }
  const message = { guild, reply: async payload => { replies.push(payload); return { edit: async payload => edits.push(payload) } } }
  const interaction = { guild, guildId: guild.id, member: { guild, user: { id: 'actor' } }, user: { id: 'actor' },
    deferReply: async payload => { replies.push(payload) }, reply: async payload => { replies.push(payload) }, editReply: async payload => edits.push(payload) }
  return { client, message, interaction, replies, edits }
}
test('prefix botinfo completes with Discord.js v14 guild members and missing caches', async () => {
  const f = fixture()
  await require('../commands/Info/botinfo').run(f.client, f.message)
  assert.equal(f.edits.length, 1)
  const json = f.edits[0].embeds[0].toJSON(), text = JSON.stringify(json)
  assert.match(text, /Servidores/); assert.match(text, /Public One/); assert.match(text, /32 ms/)
  assert.doesNotMatch(text, /Enmap|undefined|NaN|Cargando/)
  assert.ok(require('../commands/Info/botinfo').aliases.includes('infobot'))
})
test('slash botinfo acknowledges privately and replaces loading with actual data', async () => {
  const f = fixture()
  await require('../slashCommands/Info/botinfo').run(f.client, f.interaction, null, { color: 0xFFD36F }, 'es')
  assert.equal(f.replies[0].ephemeral, true); assert.equal(f.edits.length, 1)
  assert.match(JSON.stringify(f.edits[0].embeds[0].toJSON()), /Discord\.js/)
})
test('the shared bot information reports real counts and cached membership explicitly', async () => {
  const f = fixture(), { collectBotInfo, buildBotInfo } = require('../handlers/project/bot-info')
  const data = await collectBotInfo(f.client, 'guild', { cpu: async () => null })
  assert.equal(data.guilds, 2); assert.equal(data.members, 23); assert.equal(data.cachedUsers, 1); assert.equal(data.voiceConnections, 1)
  assert.equal(data.voicePing, 32); assert.equal(data.cpuPercent, null)
  const embed = buildBotInfo(f.client, data, 'en').toJSON(); assert.match(JSON.stringify(embed), /Guilds|Servers/); assert.doesNotMatch(JSON.stringify(embed), /NaN|undefined/)
})
test('a failed statistics read replaces loading with an error instead of hanging', async () => {
  const f = fixture(), { runBotInfo } = require('../handlers/project/bot-info')
  await runBotInfo(f.client, f.message, { collect: async () => { throw Error('private credential detail') } })
  assert.equal(f.edits.length, 1); assert.match(JSON.stringify(f.edits[0]), /No se pudo/)
  assert.doesNotMatch(JSON.stringify(f.edits), /private credential/)
})
