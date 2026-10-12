const {test}=require('node:test'),assert=require('node:assert/strict')
const SyncMap=require('../handlers/sync-map')
const {createWelcomeConfiguration}=require('../handlers/welcome-configuration')
function fixture(){
 const records=new Map();let fail=false,writes=0
 const model={modelName:'Fixture',findOne:filter=>({lean:async()=>structuredClone(records.get(filter.guildId)||null)}),async findOneAndUpdate(filter,update){
  if(fail)throw Error('Offline');const record=records.get(filter.guildId)||{guildId:filter.guildId}
  for(const [key,value]of Object.entries(filter)){if(key==='guildId')continue;if(value.$exists===false&&Object.hasOwn(record,key))return null;if(value.$eq!==undefined&&!require('node:util').isDeepStrictEqual(record[key],value.$eq))return null}
  const next=structuredClone(record)
  for(const[key,value]of Object.entries(update.$set)){const parts=key.split('.'),last=parts.pop();let target=next;for(const part of parts)target=target[part]??={};target[last]=structuredClone(value)}
  if(update.$inc)next.welcomeConfigRevision=(record.welcomeConfigRevision||0)+update.$inc.welcomeConfigRevision
  records.set(filter.guildId,next);writes++;return next
 }}
 const store=new SyncMap(model),service=createWelcomeConfiguration(store)
 return{records,store,service,writes:()=>writes,offline:()=>{fail=true}}
}
test('welcome channel/message aliases persist atomically with revision and preserve card/DM/other settings',async()=>{
 const f=fixture();f.records.set('g',{guildId:'g',prefix:'!',welcome:{channel:'old',msg:'Legacy',image:true,dm:true,framecolor:'gold'}})
 const before=await f.service.read('g');assert.equal(before.message,'Legacy')
 const after=await f.service.save('g',{channelId:'new',message:'Hello {user}'},before.revision)
 assert.equal(f.writes(),1);assert.notEqual(after.revision,before.revision)
 const doc=f.records.get('g');assert.equal(doc.welcome.channel,'new');assert.equal(doc.welcomeChannel,'new');assert.equal(doc.welcome.msg,doc.welcome.message);assert.equal(doc.welcomeMessage,'Hello {user}')
 assert.equal(doc.welcome.image,true);assert.equal(doc.welcome.dm,true);assert.equal(doc.prefix,'!')
 assert.equal(f.store.get('g','welcome.msg'),'Hello {user}')
})
test('optimistic writes reject stale revisions, including changes made by legacy writers',async()=>{
 const f=fixture(),before=await f.service.read('g')
 const race=await Promise.allSettled([f.service.save('g',{message:'One'},before.revision),f.service.save('g',{message:'Two'},before.revision)])
 assert.equal(race.filter(result=>result.status==='fulfilled').length,1);assert.equal(race.find(result=>result.status==='rejected').reason.code,'configuration_conflict')
 const current=await f.service.read('g');f.records.get('g').welcome.msg='Legacy changed'
 await assert.rejects(f.service.save('g',{channelId:'new'},current.revision),error=>error.code==='configuration_conflict')
})
test('failed storage does not publish optimistic cache values and invalid input cannot mutate state',async()=>{
 const f=fixture();await f.service.save('g',{message:'Committed'});f.offline()
 await assert.rejects(f.service.save('g',{message:'Failed'}),error=>error.code==='configuration_storage')
 assert.equal(f.store.get('g','welcome.msg'),'Committed')
 for(const patch of [{message:{$ne:''}},{message:'x'.repeat(501)},{channelId:{$ne:''}},{extra:true}])await assert.rejects(f.service.save('g',patch),error=>error.code==='invalid_configuration')
 assert.equal(f.writes(),1)
})
test('a durable operation ID permits reconciliation without another configuration write',async()=>{
 const f=fixture(),before=await f.service.read('g')
 const first=await f.service.save('g',{channelId:'new',message:'Hello'},before.revision,'operation-1')
 const repeated=await f.service.save('g',{channelId:'new',message:'Hello'},before.revision,'operation-1')
 assert.equal(repeated.revision,first.revision);assert.equal(f.writes(),1)
 await assert.rejects(f.service.save('g',{message:'Other'},before.revision,'operation-1'),error=>error.code==='configuration_conflict')
})
test('publishing a committed welcome change preserves card edits queued while the database write was in flight',async()=>{
 const f=fixture();await f.service.save('g',{message:'Before'})
 let entered,release;const started=new Promise(resolve=>entered=resolve),gate=new Promise(resolve=>release=resolve),write=f.store.model.findOneAndUpdate
 f.store.model.findOneAndUpdate=async(filter,update)=>{if(update.$inc){entered();await gate}return write(filter,update)}
 const saving=f.service.save('g',{message:'After'});await started
 f.store.set('g',true,'welcome.dm');release();await saving;await f.store.flush()
 assert.equal(f.store.get('g','welcome.msg'),'After');assert.equal(f.store.get('g','welcome.dm'),true)
 assert.equal(f.records.get('g').welcome.msg,'After');assert.equal(f.records.get('g').welcome.dm,true)
})
