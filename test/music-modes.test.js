const test=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events')
const track=id=>({encoded:id,info:{title:id,author:'Artist',uri:`https://example.test/${id}`,length:10000,sourceName:'youtube'}})
function fixture(id){
 const client=new EventEmitter(),player=new EventEmitter(),node={rest:{resolve:async()=>({loadType:'search',data:[track('recommended')]})}}
 player.playTrack=async options=>{player.played??=[];player.played.push(options.track.encoded);player.emit('start',{track:options.track})};player.stopTrack=async()=>{}
 client.shoukaku={players:new Map([[id,player]]),nodes:new Map(),options:{nodeResolver:()=>node}};client.channels={cache:new Map()}
 require('../handlers/musichandler')(client);client.music._bindPlayerEvents(player,id);client.music.sendNowPlaying=async()=>{}
 return {client,player,state:client.music.getState(id)}
}
async function waitFor(predicate){for(let i=0;i<50;i++){if(predicate())return;await new Promise(r=>setTimeout(r,5))}assert.fail('playback transition did not finish')}
test('finished event repeats the current track without consuming the queued track',async()=>{
 const {client,player,state}=fixture('mode-repeat-track');state.currentTrack=track('current');state.queue=[track('next')];client.music.setLoop('mode-repeat-track','track')
 player.emit('end',{reason:'finished',track:state.currentTrack});await waitFor(()=>player.played?.length===1)
 assert.deepEqual(player.played,['current']);assert.equal(state.queue[0].encoded,'next')
})
test('queue repeat advances and rotates the previous track to the end',async()=>{
 const {client,player,state}=fixture('mode-repeat-queue');state.currentTrack=track('current');state.queue=[track('next')];client.music.setLoop('mode-repeat-queue','queue')
 player.emit('end',{reason:'finished',track:state.currentTrack});await waitFor(()=>player.played?.length===1)
 assert.deepEqual(player.played,['next']);assert.deepEqual(state.queue.map(t=>t.encoded),['current'])
})
test('shuffle preserves queue membership and plays exactly one queued item on finish',async()=>{
 const {client,player,state}=fixture('mode-shuffle');state.currentTrack=track('current');state.queue=[track('one'),track('two'),track('three')]
 assert.equal(await client.music.shuffle('mode-shuffle'),true)
 assert.deepEqual(state.queue.map(t=>t.encoded).sort(),['one','three','two'])
 player.emit('end',{reason:'finished',track:state.currentTrack});await waitFor(()=>player.played?.length===1)
 assert.deepEqual([...state.queue.map(t=>t.encoded),...player.played].sort(),['one','three','two'])
 assert.equal(await client.music.shuffle('mode-shuffle'),false)
})
test('finished event with empty queue starts an autoplay recommendation automatically',async()=>{
 const {client,player,state}=fixture('mode-autoplay');state.currentTrack=track('current');client.music.setAutoplay('mode-autoplay',true)
 player.emit('end',{reason:'finished',track:state.currentTrack});await waitFor(()=>player.played?.length===1)
 assert.deepEqual(player.played,['recommended']);assert.equal(state.currentTrack.encoded,'recommended');assert.equal(state.status,'playing')
})
