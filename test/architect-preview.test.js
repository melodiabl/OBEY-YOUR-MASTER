const { test } = require('node:test')
const assert = require('node:assert/strict')
const { snapshotGuild } = require('../handlers/architect/snapshot')
const { validateBlueprint } = require('../handlers/architect/blueprint')
const { diffBlueprint } = require('../handlers/architect/diff')
function guildFixture() {
 const channels = [
  {id:'cat',name:'General',type:4,parentId:null,rawPosition:0,permissionOverwrites:{cache:new Map()}},
  {id:'chat',name:'chat',type:0,parentId:'cat',rawPosition:1,topic:'hola',permissionOverwrites:{cache:new Map([['role',{id:'role',type:0,allow:{bitfield:1024n},deny:{bitfield:0n}}]])}}
 ]
 const roles=[{id:'g',name:'@everyone',position:0,permissions:{bitfield:1024n},color:0,managed:false},
  {id:'role',name:'staff',position:1,permissions:{bitfield:8n},color:123,managed:false}]
 let channelFetches=0,roleFetches=0
 return {guild:{id:'g',name:'Servidor',channels:{cache:new Map(),async fetch(){channelFetches++;return new Map(channels.map(v=>[v.id,v]))}},roles:{cache:new Map(),async fetch(){roleFetches++;return new Map(roles.map(v=>[v.id,v]))}}},counts:()=>[channelFetches,roleFetches]}
}
test('snapshot fetches real guild resources and serializes permission bitfields',async()=>{
 const f=guildFixture(),s=await snapshotGuild(f.guild)
 assert.deepEqual(f.counts(),[1,1]);assert.equal(s.channels[1].overwrites[0].allow,'1024')
 assert.equal(s.roles[1].permissions,'8');assert.equal(s.completeness,'structure_only')
 assert.match(s.revision,/^[a-f0-9]{64}$/)
 assert.equal(JSON.stringify(s).includes('123n'),false)
})
test('blueprint validates logical IDs, names, parents and rejects deletion by omission',async()=>{
 const source=await snapshotGuild(guildFixture().guild)
 const input={baseRevision:source.revision,roles:source.roles,channels:[...source.channels,{id:'local:new',name:'ideas',type:0,parentId:'cat',position:2,topic:'',overwrites:[]}]}
 const desired=validateBlueprint(input,source)
 assert.equal(diffBlueprint(source,desired).changes[0].operation,'create')
 assert.throws(()=>validateBlueprint({...input,channels:[source.channels[0]]},source),/omit/i)
 assert.throws(()=>validateBlueprint({...input,channels:[...source.channels,{id:'local:x',name:'x',type:0,parentId:'missing',position:1,overwrites:[]}]},source),/parent/i)
 assert.throws(()=>validateBlueprint({...input,channels:[...source.channels,{id:'local:x',name:'x',type:0,parentId:'cat',position:1,overwrites:[]},{id:'local:x',name:'y',type:0,parentId:'cat',position:2,overwrites:[]}]},source),/duplicate/i)
})
test('diff exposes before/after and never proposes deletes implicitly',async()=>{
 const source=await snapshotGuild(guildFixture().guild)
 const input={baseRevision:source.revision,roles:source.roles,channels:source.channels.map(c=>c.id==='chat'?{...c,name:'conversación',parentId:null,position:3}:c)}
 const desired=validateBlueprint(input,source),diff=diffBlueprint(source,desired)
 assert.deepEqual(diff.changes.map(c=>c.operation),['update','move'])
 assert.equal(diff.changes[0].before,'chat');assert.equal(diff.changes[0].after,'conversación')
 assert.equal(diff.changes.some(c=>c.operation==='delete'),false)
 assert.equal(diff.baseRevision,source.revision)
 assert.throws(()=>validateBlueprint({...input,baseRevision:'stale'},source),/revision/i)
})

test('managed roles, everyone and explicit protected resources cannot be changed',async()=>{
 const source=await snapshotGuild(guildFixture().guild)
 for(const resource of ['g','chat']) {
  const input={baseRevision:source.revision,roles:structuredClone(source.roles),channels:structuredClone(source.channels),protectedIds:resource==='chat'?['chat']:[]}
  const item=[...input.roles,...input.channels].find(item=>item.id===resource);item.name='changed'
  assert.throws(()=>validateBlueprint(input,source),/Protected/)
 }
 const input={baseRevision:source.revision,roles:source.roles,channels:source.channels.map(channel=>({...channel,nsfw:'false'}))}
 assert.throws(()=>validateBlueprint(input,source),/nsfw/)
})
test('snapshot failure never produces a complete empty server or fake structure',async()=>{
 const f=guildFixture();f.guild.channels.fetch=async()=>{throw Error('Discord offline')}
 await assert.rejects(snapshotGuild(f.guild),/Discord offline/)
})

test('existing advanced channels are preserved even when their topic exceeds text-channel limits',async()=>{
 const fixture=guildFixture(),originalFetch=fixture.guild.channels.fetch
 fixture.guild.channels.fetch=async()=>{const channels=await originalFetch();channels.set('forum',{id:'forum',type:15,name:'foro',topic:'x'.repeat(3000),parentId:'cat',position:3,permissionOverwrites:{cache:new Map()}});return channels}
 const source=await snapshotGuild(fixture.guild)
 const input={baseRevision:source.revision,roles:source.roles,channels:source.channels}
 assert.equal(diffBlueprint(source,validateBlueprint(input,source)).changes.length,0)
})

test('protected channels compare data independent of JSON key order',async()=>{
 const fixture=guildFixture(),fetch=fixture.guild.channels.fetch
 fixture.guild.channels.fetch=async()=>{const channels=await fetch();channels.set('forum',{id:'forum',type:15,name:'foro',parentId:'cat',position:3,permissionOverwrites:{cache:new Map()}});return channels}
 const source=await snapshotGuild(fixture.guild)
 const channels=source.channels.map(channel=>Object.fromEntries(Object.entries(channel).reverse()))
 assert.equal(diffBlueprint(source,validateBlueprint({baseRevision:source.revision,roles:source.roles,channels},source)).changes.length,0)
})
test('role moves describe order without an invented channel parent',async()=>{
 const source=await snapshotGuild(guildFixture().guild)
 const desired=validateBlueprint({baseRevision:source.revision,channels:source.channels,roles:source.roles.map(role=>role.id==='role'?{...role,position:2}:role)},source)
 const diff=diffBlueprint(source,desired)
 assert.deepEqual(diff.changes[0].before,{position:1})
 assert.deepEqual(diff.changes[0].after,{position:2})
})
test('role gradient colors participate in structural revision even if primary color stays the same',async()=>{
 const fixture=guildFixture(),fetch=fixture.guild.roles.fetch
 const colors={primaryColor:123,secondaryColor:456,tertiaryColor:null}
 fixture.guild.roles.fetch=async()=>{const roles=await fetch();roles.get('role').colors={...colors};return roles}
 const first=await snapshotGuild(fixture.guild)
 assert.deepEqual(first.roleColors.role,colors)
 colors.secondaryColor=789
 const changed=await snapshotGuild(fixture.guild)
 assert.notEqual(changed.revision,first.revision);assert.equal(changed.roles[1].color,first.roles[1].color)
})
