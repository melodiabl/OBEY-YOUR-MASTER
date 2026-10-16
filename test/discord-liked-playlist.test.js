const test = require('node:test'), assert = require('node:assert/strict')
const Playlist = require('../database/schemas/PlaylistSchema')
const LikedSongs = require('../database/schemas/LikedSongsSchema')
function fixture(t, { songs = [], manual = [] } = {}) {
  const reads = [], replies = [], played = []
  t.mock.method(Playlist, 'find', query => ({ lean: async () => { reads.push(['manual', query.userId]); return manual } }))
  t.mock.method(Playlist, 'findOne', () => { throw new Error('Automatic collection must not query a saved playlist') })
  t.mock.method(LikedSongs, 'find', query => ({ sort() { return this }, lean: async () => { reads.push(['liked', query.userId]); return songs.filter(song => song.userId === query.userId) } }))
  const interaction = { user: { id: 'owner', username: 'Owner' }, guild: { id: 'guild' }, channelId: 'text',
    member: { voice: { channel: { id: 'voice', name: 'Voice' } } },
    options: { getString: () => 'Tus Me gusta', getUser: () => null },
    deferReply: async options => { replies.push({ deferred: options }) },
    reply: async payload => { replies.push(payload) }, editReply: async payload => { replies.push(payload) } }
  const client = { music: { getState: () => ({ currentTrack: { info: { title: 'Already playing' } } }),
    playCollection: async (...args) => { played.push(args); return args[3].length } } }
  const embed = () => replies.at(-1).embeds[0].toJSON()
  return { reads, replies, played, interaction, client, embed }
}
const song = { userId: 'owner', trackId: 'legacy', uri: 'https://example.test/song', title: 'My song', author: 'Artist', length: 180000, sourceName: 'youtube' }
test('Discord playlist list pins the automatic collection even without saved playlists', async t => {
  const f = fixture(t)
  await require('../slashCommands/Playlist/list').run(f.client, f.interaction)
  assert.match(f.embed().description, /Tus Me gusta.*0 canciones/)
  assert.match(f.embed().description, /playlist show/)
  assert.equal(f.replies[0].deferred.ephemeral, true)
})
test('Discord playlist list includes deduplicated hearts and preserves manual playlists', async t => {
  const f = fixture(t, { songs: [song, { ...song, trackId: 'other-encoding' }, { ...song, userId: 'other' }], manual: [{ name: 'Road trip', tracks: [], isPublic: true }] })
  await require('../slashCommands/Playlist/list').run(f.client, f.interaction)
  const text = f.embed().description
  assert.match(text, /Tus Me gusta.*1 canciones/); assert.ok(text.indexOf('Tus Me gusta') < text.indexOf('Road trip'))
  assert.equal(f.embed().title.includes('(2)'), true)
  assert.deepEqual(f.reads, [['manual', 'owner'], ['liked', 'owner']])
})
test('Discord playlist show opens fresh personal hearts with track durations', async t => {
  const f = fixture(t, { songs: [song] })
  f.interaction.options.getString = () => '  TUS   ME GUSTA  '
  await require('../slashCommands/Playlist/show').run(f.client, f.interaction)
  assert.match(f.embed().title, /Tus Me gusta/); assert.match(f.embed().description, /My song.*3:00/)
  assert.equal(f.embed().fields.find(field => field.name.includes('Visibilidad')).value, 'Privada')
})
test('another user cannot open or query someone else’s automatic collection', async t => {
  const f = fixture(t, { songs: [song] }); f.interaction.options.getUser = () => ({ id: 'other', username: 'Other' })
  await require('../slashCommands/Playlist/show').run(f.client, f.interaction)
  assert.match(f.embed().description, /privada/i); assert.deepEqual(f.reads, [])
})
test('Discord playlist play queues personal hearts once through the shared collection engine', async t => {
  const f = fixture(t, { songs: [song, { ...song, trackId: 'blocked', uri: 'https://example.test/adult', sourceName: 'nsfw' }] })
  await require('../slashCommands/Playlist/play').run(f.client, f.interaction)
  assert.equal(f.played.length, 1)
  const args = f.played[0]; assert.deepEqual(args.slice(0, 3), ['guild', 'voice', 'text'])
  assert.equal(args[3].length, 1); assert.equal(args[3][0].info.uri, song.uri); assert.equal(args[3][0].info.length, song.length)
  assert.equal(args[4].id, 'owner'); assert.match(f.embed().description, /1.*agregadas a la cola/)
})
test('empty automatic collection does not connect or enqueue music', async t => {
  const f = fixture(t)
  await require('../slashCommands/Playlist/play').run(f.client, f.interaction)
  assert.match(f.embed().description, /vacía/); assert.deepEqual(f.played, [])
})
test('ordinary saved playlists remain playable with their original metadata', async t => {
  const f = fixture(t)
  f.interaction.options.getString = () => 'Road trip'
  t.mock.method(Playlist, 'findOne', async query => {
    assert.equal(query.userId, 'owner'); assert.ok(query.name.$regex.test('Road trip'))
    return { name: 'Road trip', tracks: [{ duration: 120000, toObject: () => ({ title: 'Manual song', uri: 'https://example.test/manual', sourceName: 'youtube' }) }] }
  })
  await require('../slashCommands/Playlist/play').run(f.client, f.interaction)
  assert.equal(f.played[0][3][0].info.title, 'Manual song'); assert.equal(f.played[0][3][0].info.length, 120000)
  assert.deepEqual(f.reads, [])
})
test('invalid links and missing voice do not start a playlist', async t => {
  const f = fixture(t, { songs: [{ ...song, uri: 'file:///secret' }] })
  await require('../slashCommands/Playlist/play').run(f.client, f.interaction)
  assert.match(f.embed().description, /no tiene canciones disponibles/); assert.deepEqual(f.played, [])
  f.interaction.member.voice.channel = null
  await require('../slashCommands/Playlist/play').run(f.client, f.interaction)
  assert.match(f.embed().description, /canal de voz/); assert.deepEqual(f.played, [])
})
test('the automatic collection cannot be manually created, edited, deleted or made public', async t => {
  const f = fixture(t)
  for (const method of ['create', 'findOneAndDelete', 'findOneAndUpdate', 'countDocuments'])
    t.mock.method(Playlist, method, () => { throw new Error('Automatic playlist must not be persisted or mutated') })
  for (const command of ['create', 'add', 'delete', 'share']) {
    await require('../slashCommands/Playlist/' + command).run(f.client, f.interaction)
    assert.match(f.embed().description, /automática/); assert.match(f.embed().description, /corazón/)
  }
  assert.deepEqual(f.reads, [])
})
test('prefix playlist show can open the automatic collection', async t => {
  const f = fixture(t, { songs: [song] })
  const message = { author: f.interaction.user, guild: f.interaction.guild, member: f.interaction.member, channel: { id: 'text' },
    reply: async payload => { f.replies.push(payload); return { edit: async result => f.replies.push(result) } } }
  await require('../handlers/music/prefix-compat')('playlist')(f.client, message, ['show', 'Tus', 'Me', 'gusta'])
  assert.match(f.embed().title, /Tus Me gusta/); assert.match(f.embed().description, /My song/)
})
