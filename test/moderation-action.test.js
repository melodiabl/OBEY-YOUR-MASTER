const test=require('node:test'),assert=require('node:assert/strict')
const {runModeration}=require('../handlers/moderation/action')
const {createCaseAllocator}=require('../handlers/moderation/cases')
function fixture(){
 const calls=[],replies=[]
 const target={id:'target',send:async()=>calls.push('dm')},member={bannable:true,kickable:true,moderatable:true,roles:{highest:{position:1}},kick:async()=>calls.push('kick'),timeout:async()=>calls.push('timeout')}
 const interaction={guild:{id:'guild',name:'Guild',ownerId:'owner',members:{me:{permissions:{has:()=>true}},fetch:async()=>member,ban:async()=>calls.push('ban')}},user:{id:'mod'},member:{permissions:{has:()=>true},roles:{highest:{position:5}}},options:{getUser:()=>target,getString:()=>null},deferReply:async()=>calls.push('ack'),editReply:async payload=>replies.push(payload)}
 const client={user:{id:'bot'},settings:{get:()=> 'en'}}
 const dependencies={allocate:async()=>1,model:{create:async()=>calls.push('record')},notificationTimeoutMs:5}
 return {client,interaction,dependencies,calls,replies,target,member}
}
test('private notice describes only an applied action, after the Discord operation',async()=>{
 const f=fixture();await runModeration(f.client,f.interaction,'ban',{},f.dependencies)
 assert.deepEqual(f.calls,['ack','ban','record','dm']);assert.match(f.replies[0].embeds[0].toJSON().title,/User banned/)
})
test('Discord rejection never sends a successful sanction DM or creates its case',async()=>{
 const f=fixture();f.interaction.guild.members.ban=async()=>{throw new Error('private token')}
 await runModeration(f.client,f.interaction,'ban',{},f.dependencies)
 assert.deepEqual(f.calls,['ack']);assert.doesNotMatch(f.replies[0].content,/private token/)
})
test('record failure after applied action is disclosed without claiming the action failed',async()=>{
 const f=fixture();f.dependencies.model.create=async()=>{throw new Error('db')}
 await runModeration(f.client,f.interaction,'kick',{},f.dependencies)
 const embed=f.replies[0].embeds[0].toJSON();assert.match(embed.title,/Member kicked/);assert.match(embed.description,/case could not be saved/)
})
test('timeout validates the allowed duration before touching the member',async()=>{
 const f=fixture();await runModeration(f.client,f.interaction,'timeout',{duration:undefined},f.dependencies)
 assert.deepEqual(f.calls,['ack']);assert.match(f.replies[0].content,/duration is invalid/)
})
test('actor permission and role hierarchy are enforced independently of bot permission',async()=>{
 const f=fixture();f.interaction.member.permissions.has=()=>false
 await runModeration(f.client,f.interaction,'ban',{},f.dependencies);assert.deepEqual(f.calls,['ack'])
})
test('counter allocator produces distinct guild-scoped numbers across concurrent callers',async()=>{
 const counters=new Map(),counter={updateOne:async({_id},{$max})=>counters.set(_id,Math.max(counters.get(_id)||0,$max.value)),findOneAndUpdate:async({_id})=>{const value=(counters.get(_id)||0)+1;counters.set(_id,value);return {value}}}
 const cases={findOne:()=>({sort:()=>({select:()=>({lean:async()=>({caseId:10})})})})}
 const allocate=createCaseAllocator(counter,cases),values=await Promise.all(Array.from({length:20},()=>allocate('guild')))
 assert.equal(new Set(values).size,20);assert.equal(Math.min(...values),11)
 assert.equal(await allocate('other'),11)
})
