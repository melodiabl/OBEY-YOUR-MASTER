const { test } = require('node:test')
const assert = require('node:assert/strict')
async function fixture(request, run) {
 const transport=require('../handlers/music/lyrics-http'), original=transport.requestJson
 const path=require.resolve('../handlers/music/lyrics'), cache=require.cache[path]
 transport.requestJson=request;delete require.cache[path]
 try { await run(require(path)) }
 finally { transport.requestJson=original;delete require.cache[path];if(cache)require.cache[path]=cache }
}
test('missing lyrics and failed providers retain different retry states',async()=>{
 await fixture(async()=>{throw Error('lyrics HTTP 404')},async provider=>{
  assert.equal((await provider.fetchLyricsResult('missing','author')).status,'missing')
 })
 await fixture(async()=>{throw Error('lyrics provider timeout')},async provider=>{
  assert.equal((await provider.fetchLyricsResult('failure','author')).status,'unavailable')
  assert.equal(await provider.fetchLyrics('failure','author'),null)
 })
})
test('Discord and web requests for one track share a single in-flight lookup',async()=>{
 let calls=0,release
 await fixture(()=>{calls++;return new Promise(resolve=>{release=resolve})},async provider=>{
  const discord=provider.fetchLyrics('same','artist'),web=provider.fetchLyricsResult('same','artist')
  assert.equal(calls,1)
  release({lines:[{line:'complete',range:{start:1000}}],text:'complete'})
  assert.equal((await discord).plain,'complete');assert.equal((await web).status,'ready')
  assert.equal(calls,1)
 })
})
