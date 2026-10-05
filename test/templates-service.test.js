const {test}=require('node:test'),assert=require('node:assert/strict')
const {createTemplateService}=require('../handlers/templates/service')
const {createArchitectService}=require('../handlers/architect/service')
const {generateProposal}=require('../handlers/architect/wizard')
function fixture(){
 const source={guildId:'g',revision:'r',channels:[],roles:[]},blank={schemaVersion:1,baseRevision:'r',channels:[],roles:[],protectedIds:[]}
 const blueprint=generateProposal(blank,{community:'gaming',theme:'minimal',size:'small',language:'es',decoration:'none',spaces:[]}).blueprint
 const records=new Map();let writes=0
 const repository={async create(ownerId,definition){writes++;const record={id:'12345678-1234-4123-8123-123456789012',ownerId,definition};records.set(record.id,record);return record},async list(ownerId){return [...records.values()].filter(record=>record.ownerId===ownerId)},async get(id,ownerId){const record=records.get(id);return record?.ownerId===ownerId?record:null},async remove(id,ownerId){if(records.get(id)?.ownerId!==ownerId)return false;return records.delete(id)}}
 const architect=createArchitectService({snapshot:async()=>source})
 const service=createTemplateService({repository,architect})
 return{service,blank,blueprint,source,writes:()=>writes}
}
test('official bases are available without storage; private capture/import/export/deletion are actor scoped',async()=>{
 const f=fixture(),catalog=await f.service.list('actor')
 assert.equal(catalog.official.length,10);assert.equal(catalog.private.length,0)
 const record=await f.service.capture({id:'g'},'actor',f.blueprint,{name:'Mi base',selection:'new'})
 assert.equal(f.writes(),1);assert.equal((await f.service.list('other')).private.length,0)
 await assert.rejects(f.service.get(record.id,'other'),error=>error.code==='template_not_found')
 await assert.rejects(f.service.remove(record.id,'other'),error=>error.code==='template_not_found')
 const exported=await f.service.get(record.id,'actor');assert.equal(exported.definition.format,'obey-template')
 const proposed=await f.service.preview({id:'g'},'actor',f.blank,record.id)
 assert.equal(f.writes(),1);assert.ok(proposed.diff.counts.create>0)
 const imported=await f.service.import('other',exported.definition)
 assert.equal(f.writes(),2);assert.equal((await f.service.list('other')).private.length,1)
 await f.service.remove(imported.id,'other');assert.equal((await f.service.list('other')).private.length,0)
})
test('invalid imports never persist, and official preview requires no private storage',async()=>{
 const f=fixture();await assert.rejects(f.service.import('actor',{format:'discord-template'}),error=>error.code==='invalid_template');assert.equal(f.writes(),0)
 const service=createTemplateService({architect:createArchitectService({snapshot:async()=>f.source}),storageReady:()=>false})
 const catalog=await service.list('actor');assert.equal(catalog.storageAvailable,false);assert.equal(catalog.official.length,10)
 assert.ok((await service.preview({id:'g'},'actor',f.blank,'official:gaming')).diff.counts.create)
 await assert.rejects(service.import('actor',{}),error=>error.code==='storage_unavailable')
})
