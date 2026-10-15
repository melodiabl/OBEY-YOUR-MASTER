const test=require('node:test'),assert=require('node:assert/strict')
const {createTicketService}=require('../handlers/tickets/service')
function fixture(status='open'){
 const record={guildId:'guild',channelId:'channel',userId:'owner',status,save:async()=>{}},changes=[]
 const model={findOne:async filter=>filter.guildId===record.guildId&&filter.channelId===record.channelId?record:null,findOneAndUpdate:async(filter,update)=>{if(record.status!==filter.status||record.claimedBy)return null;Object.assign(record,update.$set);return record}}
 const interaction={guild:{id:'guild',members:{fetch:async id=>({id})}},channelId:'channel',user:{id:'staff'},member:{permissions:{has:()=>true}},appPermissions:{has:()=>true},channel:{name:'ticket-channel',permissionOverwrites:{cache:new Map(),edit:async(target,fields)=>changes.push({target,fields}),delete:async target=>changes.push({rollback:target})}}}
 return {record,changes,interaction,client:{user:{id:'bot'}},service:createTicketService(model)}
}
test('channel name cannot authorize an unregistered ticket',async()=>{
 const f=fixture();f.interaction.channelId='other'
 await assert.rejects(f.service.perform(f.client,f.interaction,'close'),{code:'notTicket'});assert.equal(f.changes.length,0)
})
test('ticket lookup is scoped to the actual guild',async()=>{
 const f=fixture();f.interaction.guild.id='other'
 await assert.rejects(f.service.perform(f.client,f.interaction,'claim'),{code:'notTicket'})
})
test('concurrent claim chooses one assignee and rejects the other',async()=>{
 const f=fixture(),other={...f.interaction,user:{id:'other'}}
 const result=await Promise.allSettled([f.service.perform(f.client,f.interaction,'claim'),f.service.perform(f.client,other,'claim')])
 assert.equal(result.filter(r=>r.status==='fulfilled').length,1);assert.equal(f.record.claimedBy,'staff');assert.equal(f.record.status,'claimed')
})
test('ticket owner may close a claimed ticket while preserving channel and history',async()=>{
 const f=fixture('claimed');f.interaction.user.id='owner';f.interaction.member.permissions.has=()=>false
 f.interaction.channel.delete=()=>{throw new Error('must not delete')}
 await f.service.perform(f.client,f.interaction,'close')
 assert.equal(f.record.status,'closed');assert.deepEqual(f.changes[0].fields,{SendMessages:false,AddReactions:false})
})
test('failed close save restores the previous absence of a member overwrite',async()=>{
 const f=fixture();f.record.save=async()=>{throw new Error('db failed')}
 await assert.rejects(f.service.perform(f.client,f.interaction,'close'),/db failed/)
 assert.equal(f.changes[1].rollback,'owner')
})
test('owner removal is denied before overwrites are touched',async()=>{
 const f=fixture();await assert.rejects(f.service.perform(f.client,f.interaction,'remove',{id:'owner'}),{code:'ownerProtected'});assert.equal(f.changes.length,0)
})
test('removing an ordinary guest sets deny instead of exposing inherited channel access',async()=>{
 const f=fixture();await f.service.perform(f.client,f.interaction,'remove',{id:'guest'});assert.equal(f.changes[0].fields.ViewChannel,false)
})
