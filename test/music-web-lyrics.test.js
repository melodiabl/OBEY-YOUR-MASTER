const { test } = require('node:test')
const assert = require('node:assert/strict')
const { getCurrentLyrics } = require('../handlers/music/web-lyrics')
function fixture() {
 const track = { info: { identifier:'track',title:'Título',author:'Autor' } }
 let state = { currentTrack:track,sessionId:'session',playbackId:1 }
 const music = { getState:()=>state,getPublicState:()=>({ current:{elapsed:4000},paused:state.paused,revision:2 }) }
 return { music, setState:s=>{state=s},state }
}
test('web uses the full shared lyrics result and current playback identity',async()=>{
 const f=fixture(),text='verso completo\n'.repeat(1000)
 const result=await getCurrentLyrics(f.music,'g',async(title,author)=>{
  assert.equal(title,'Título');assert.equal(author,'Autor');return {plain:text,lines:[]}
 })
 assert.equal(result.text,text);assert.equal(result.mode,'plain');assert.equal(result.playbackId,1)
 assert.equal(result.elapsed,4000)
})
test('synced lines preserve the entire text and updated pause/seek state',async()=>{
 const f=fixture()
 const result=await getCurrentLyrics(f.music,'g',async()=>{f.state.paused=true;return {lines:[{ms:1000,text:'Uno'},{ms:2000,text:'Dos'}]}})
 assert.equal(result.text,'Uno\nDos');assert.equal(result.mode,'synced');assert.equal(result.paused,true)
})
test('late lyrics are discarded after replaying the same track or replacing the session',async()=>{
 for(const change of [{playbackId:2},{sessionId:'new'},{currentTrack:null}]){
  const f=fixture()
  const result=await getCurrentLyrics(f.music,'g',async()=>{f.setState({...f.state,...change});return {plain:'obsolete'}})
  assert.equal(result.status,'track_changed');assert.equal(result.text,undefined)
 }
})
test('idle, streams, missing lyrics and failed providers expose no internal errors',async()=>{
 const f=fixture()
 f.setState({...f.state,currentTrack:null})
 assert.equal((await getCurrentLyrics(f.music,'g',assert.fail)).status,'idle')
 f.state.currentTrack.info.isStream=true;f.setState(f.state)
 assert.equal((await getCurrentLyrics(f.music,'g',assert.fail)).status,'stream')
 f.state.currentTrack.info.isStream=false
 assert.equal((await getCurrentLyrics(f.music,'g',async()=>null)).status,'missing')
 const result=await getCurrentLyrics(f.music,'g',async()=>{throw Error('private provider token')})
 assert.equal(result.status,'unavailable');assert.equal(JSON.stringify(result).includes('private'),false)
})
