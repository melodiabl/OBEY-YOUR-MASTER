const { test } = require('node:test')
const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
function fixture(id, resolve) {
  const client = new EventEmitter(), player = new EventEmitter()
  player.playTrack = async options => { player.played ||= []; player.played.push(options.track.encoded); player.emit('start', { track: options.track }) }
  player.stopTrack = async () => {}
  const node = { rest: { resolve: resolve || (async () => ({ loadType: 'empty', data: {} })) } }
  client.shoukaku = { players: new Map([[id, player]]), nodes: new Map(), options: { nodeResolver: () => node } }
  client.channels = { cache: new Map() }
  require('../handlers/musichandler')(client)
  client.music._bindPlayerEvents(player, id)
  client.music.sendNowPlaying = async () => {}
  return { client, player, state: client.music.getState(id) }
}
const track = (encoded, title = encoded, author = 'Artist') => ({ encoded, info: { title, author, uri: `https://example.com/${encoded}`, length: 180000, sourceName: 'youtube' } })
test('REST rejection of a queued track recovers and advances instead of remaining loading', async () => {
  const { client, player, state } = fixture('rest-reject')
  const original = player.playTrack
  player.playTrack = options => options.track.encoded === 'bad' ? Promise.reject(new Error('load rejected')) : original(options)
  state.queue = [track('bad'), track('good')]
  await client.music._playNext('rest-reject', player)
  assert.equal(state.currentTrack.encoded, 'good')
  assert.equal(state.status, 'playing')
})
test('recovery never substitutes an unrelated YouTube result for the requested song', async () => {
  const unrelated = track('unrelated', 'Different Song', 'Other Artist')
  const { client, player, state } = fixture('wrong-fallback', async () => ({ loadType: 'search', data: [unrelated] }))
  state.currentTrack = track('failed', 'Requested Song')
  state.queue = [track('next')]
  await client.music._recoverFailedTrack('wrong-fallback', player, 'failure')
  assert.equal(state.currentTrack.encoded, 'next')
})
test('recovered YouTube track can fail only once before moving on', async () => {
  const replacement = track('replacement', 'Song')
  const { client, player, state } = fixture('fallback-once', async query => ({ loadType: 'search', data: query.startsWith('ytsearch:') ? [replacement] : [] }))
  state.currentTrack = track('failed', 'Song'); state.queue = [track('next')]
  await client.music._recoverFailedTrack('fallback-once', player, 'failure')
  assert.equal(state.currentTrack.encoded, 'replacement')
  assert.equal(state.currentTrack._fallbackAttempted, true)
  await client.music._recoverFailedTrack('fallback-once', player, 'failure')
  assert.equal(state.currentTrack.encoded, 'next')
})
test('autoplay ignores duplicate encodings even when metadata differs', async () => {
  const duplicate = track('old', 'Alternate metadata')
  duplicate.info.uri = 'https://example.com/alternate'
  const fresh = track('fresh')
  const { client, player, state } = fixture('auto-duplicate', async () => ({ loadType: 'search', data: [duplicate, fresh] }))
  state.currentTrack = track('old'); state.autoplay = true
  const random = Math.random; Math.random = () => 0
  try { await client.music._playNext('auto-duplicate', player) } finally { Math.random = random }
  assert.equal(state.currentTrack.encoded, 'fresh')
})
test('disabling autoplay during lookup cannot start a recommendation', async () => {
  let release, entered
  const started = new Promise(done => { entered = done })
  const { client, player, state } = fixture('auto-disable', () => { entered(); return new Promise(done => { release = done }) })
  state.currentTrack = track('old'); state.autoplay = true
  const pending = client.music._playNext('auto-disable', player)
  await started
  client.music.setAutoplay('auto-disable', false)
  release({ loadType: 'search', data: [track('recommendation')] })
  await pending
  assert.equal(state.currentTrack, null)
  assert.equal(player.played, undefined)
})
test('provider lookup times out rather than holding continuation forever', async () => {
 const {resolveWithTimeout}=require('../handlers/music/resolve-timeout')
 await assert.rejects(resolveWithTimeout({rest:{resolve:()=>new Promise(()=>{})}},'query',10),/timed out/)
})
test('closed event from a retired player cannot recover the replacement session', () => {
 const {client,player,state}=fixture('retired-player')
 state.currentTrack=track('current');state.status='playing'
 client.shoukaku.players.set('retired-player',new EventEmitter())
 player.emit('closed',{})
 assert.equal(state.status,'playing')
})
test('cleanup end does not consume the next queued song',async()=>{
 const {client,player,state}=fixture('cleanup-end')
 state.currentTrack=track('current');state.queue=[track('next')]
 player.emit('end',{reason:'cleanup',track:state.currentTrack})
 await new Promise(resolve=>setImmediate(resolve))
 assert.equal(state.currentTrack.encoded,'current');assert.equal(state.queue.length,1)
})
test('abort releases a provider lookup even when its remote promise never settles',async()=>{
 const {resolveWithTimeout}=require('../handlers/music/resolve-timeout')
 const controller=new AbortController()
 const pending=resolveWithTimeout({rest:{resolve:()=>new Promise(()=>{})}},'query',8000,controller.signal)
 controller.abort()
 await assert.rejects(pending,/cancelled/)
})
test('stop cancels an in-flight autoplay lookup and a late result cannot revive playback',async()=>{
 let entered,release
 const started=new Promise(resolve=>{entered=resolve})
 const {client,player,state}=fixture('stop-autoplay',()=>{entered();return new Promise(resolve=>{release=resolve})})
 client.shoukaku.leaveVoiceChannel=async id=>client.shoukaku.players.delete(id)
 state.currentTrack=track('current');state.autoplay=true
 const pending=client.music._playNext('stop-autoplay',player)
 await started
 await client.music.stop('stop-autoplay')
 await pending
 release({loadType:'search',data:[track('late')]})
 await new Promise(resolve=>setImmediate(resolve))
 assert.equal(player.played,undefined)
 assert.equal(client.music.getState('stop-autoplay').currentTrack,null)
})
