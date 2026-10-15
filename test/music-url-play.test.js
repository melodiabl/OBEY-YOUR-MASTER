const test=require('node:test'), assert=require('node:assert/strict')
const song={encoded:'song',info:{title:'Song',author:'Artist',uri:'https://example.com/song',length:10000}}
function fixture(result){
 const state={currentTrack:null},edits=[],enqueued=[]
 const client={user:{id:'bot'},settings:{get:(_,key)=>key==='MUSIC'?true:key==='language'?'en':{}},music:{
  search:async()=>result,joinChannel:async()=>({}),getState:()=>state,
  enqueue:async(guildId,tracks)=>{enqueued.push({guildId,tracks});state.currentTrack=tracks[0]},
  _playNext:async()=>{throw new Error('duplicate playback')},
 }}
 const reply={edit:async value=>edits.push(value)}
 const voice={id:'voice',permissionsFor:()=>({has:()=>true})}
 const message={guild:{id:'guild',name:'Guild'},member:{voice:{channel:voice}},author:{id:'user'},channel:{id:'text'},reply:async()=>reply}
 return {client,message,edits,enqueued,voice,state}
}
test('prefix URL plays the track for its guild and reports now-playing before enqueue mutates state',async()=>{
 const f=fixture({loadType:'track',tracks:[song]})
 await require('../commands/Music/play').run(f.client,f.message,['https://example.com/song'])
 assert.equal(f.enqueued.length,1);assert.equal(f.enqueued[0].guildId,'guild')
 assert.match(f.edits.at(-1).embeds[0].toJSON().title,/Now playing/)
})
test('prefix URL playlist enqueues once without forcing a second transition',async()=>{
 const f=fixture({loadType:'playlist',tracks:[song,song],playlistName:'List'})
 await require('../commands/Music/play').run(f.client,f.message,['https://example.com/list'])
 assert.equal(f.enqueued.length,1);assert.equal(f.enqueued[0].tracks.length,2)
 assert.match(f.edits.at(-1).embeds[0].toJSON().title,/Playlist added/)
})
test('slash URL uses the same now-playing decision as prefix',async()=>{
 const f=fixture({loadType:'track',tracks:[song]})
 const interaction={guild:f.message.guild,user:f.message.author,member:f.message.member,channelId:'text',options:{getString:()=> 'https://example.com/song'},deferReply:async()=>{},editReply:async value=>f.edits.push(value)}
 await require('../slashCommands/Music/play').run(f.client,interaction)
 assert.equal(f.enqueued.length,1)
 assert.match(f.edits.at(-1).embeds[0].toJSON().title,/Now playing/)
})
